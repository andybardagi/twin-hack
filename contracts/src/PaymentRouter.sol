// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

interface ICurveTwocrypto {
    function coins(uint256 index) external view returns (address);
    function get_dx(uint256 i, uint256 j, uint256 dy) external view returns (uint256);
    function exchange(uint256 i, uint256 j, uint256 dx, uint256 minDy) external returns (uint256);
}

/// @notice Settles merchant-signed QR orders paid with a customer-signed intent, routing Twin tokens through
/// their Curve Twocrypto pools against USDT0.
contract PaymentRouter is EIP712, Ownable2Step {
    using SafeERC20 for IERC20;

    struct Order {
        address merchant;
        address receiveToken;
        uint256 receiveAmount;
        bytes32 orderId;
        uint64 expiry;
        uint16 feeBps;
    }

    struct Intent {
        address payer;
        address payToken;
        uint256 maxPayAmount;
        bytes32 orderHash;
    }

    /// @dev EIP-2612 permit for `Intent.payToken`; `value == 0` skips it.
    struct PermitData {
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    bytes32 public constant ORDER_TYPEHASH = keccak256(
        "Order(address merchant,address receiveToken,uint256 receiveAmount,bytes32 orderId,uint64 expiry,uint16 feeBps)"
    );
    bytes32 public constant INTENT_TYPEHASH =
        keccak256("Intent(address payer,address payToken,uint256 maxPayAmount,bytes32 orderHash)");

    uint16 public constant MAX_FEE_BPS = 200;
    uint16 public constant BPS_DENOMINATOR = 10_000;
    /// @dev Curve's get_dx lands slightly under the target dy, so quotes are padded before swapping.
    uint16 public constant GET_DX_BUFFER_BPS = 2;
    uint256 private constant TWIN_COIN_INDEX = 0;
    uint256 private constant USDT0_COIN_INDEX = 1;

    IERC20 public immutable usdt0;

    uint16 public feeBps;
    address public treasury;

    mapping(address twinToken => address pool) public poolOf;
    mapping(address merchant => address signingKey) public signingKeyOf;
    mapping(address merchant => address payout) public payoutAddressOf;
    mapping(address merchant => mapping(bytes32 orderId => bool)) public paid;

    event SigningKeySet(address indexed merchant, address signingKey);
    event PayoutAddressSet(address indexed merchant, address payout);
    event FeeBpsSet(uint16 feeBps);
    event TreasurySet(address treasury);
    event PoolSet(address indexed twinToken, address pool);
    event PaymentSettled(
        address indexed merchant,
        bytes32 indexed orderId,
        address indexed payer,
        address payToken,
        uint256 payAmount,
        address receiveToken,
        uint256 receiveAmount,
        uint256 fee,
        address payout
    );

    error FeeTooHigh();
    error ZeroAddress();
    error LengthMismatch();
    error PoolMismatch();
    error InvalidMerchantSignature();
    error InvalidPayerSignature();
    error OrderHashMismatch();
    error OrderExpired();
    error OrderAlreadyPaid();
    error UnsupportedToken(address token);
    error InvalidPayout();
    error MaxPayExceeded();
    error FeeMismatch();

    constructor(
        address initialOwner,
        address initialTreasury,
        uint16 initialFeeBps,
        IERC20 usdt0_,
        address[] memory twinTokens,
        address[] memory pools
    ) EIP712("PaymentRouter", "1") Ownable(initialOwner) {
        if (twinTokens.length != pools.length) revert LengthMismatch();
        usdt0 = usdt0_;
        _setTreasury(initialTreasury);
        _setFeeBps(initialFeeBps);
        for (uint256 i; i < twinTokens.length; ++i) {
            _setPool(twinTokens[i], pools[i]);
        }
    }

    /// @param signingKey Device key that signs this merchant's orders; address(0) revokes it.
    function setSigningKey(address signingKey) external {
        signingKeyOf[msg.sender] = signingKey;
        emit SigningKeySet(msg.sender, signingKey);
    }

    /// @param payout Where settlements go; address(0) pays the merchant address itself.
    function setPayoutAddress(address payout) external {
        if (payout == address(this)) revert InvalidPayout();
        payoutAddressOf[msg.sender] = payout;
        emit PayoutAddressSet(msg.sender, payout);
    }

    function setFeeBps(uint16 newFeeBps) external onlyOwner {
        _setFeeBps(newFeeBps);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        _setTreasury(newTreasury);
    }

    /// @param pool Curve Twocrypto pool with coins (twinToken, USDT0); address(0) unsupports the token.
    function setPool(address twinToken, address pool) external onlyOwner {
        _setPool(twinToken, pool);
    }

    function pay(
        Order calldata order,
        bytes calldata merchantSig,
        Intent calldata intent,
        bytes calldata payerSig,
        PermitData calldata permit
    ) external {
        _verify(order, merchantSig, intent, payerSig);
        paid[order.merchant][order.orderId] = true;
        if (permit.value != 0) _tryPermit(intent, permit);
        _settle(order, intent);
    }

    function hashOrder(Order calldata order) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    ORDER_TYPEHASH,
                    order.merchant,
                    order.receiveToken,
                    order.receiveAmount,
                    order.orderId,
                    order.expiry,
                    order.feeBps
                )
            )
        );
    }

    function hashIntent(Intent calldata intent) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(INTENT_TYPEHASH, intent.payer, intent.payToken, intent.maxPayAmount, intent.orderHash))
        );
    }

    function _verify(Order calldata order, bytes calldata merchantSig, Intent calldata intent, bytes calldata payerSig)
        private
        view
    {
        bytes32 orderHash = hashOrder(order);
        address signingKey = signingKeyOf[order.merchant];
        if (signingKey == address(0) || !SignatureChecker.isValidSignatureNow(signingKey, orderHash, merchantSig)) {
            revert InvalidMerchantSignature();
        }
        if (!SignatureChecker.isValidSignatureNow(intent.payer, hashIntent(intent), payerSig)) {
            revert InvalidPayerSignature();
        }
        if (intent.orderHash != orderHash) revert OrderHashMismatch();
        if (order.feeBps != feeBps) revert FeeMismatch();
        if (block.timestamp > order.expiry) revert OrderExpired();
        if (paid[order.merchant][order.orderId]) revert OrderAlreadyPaid();
        _requireSupported(order.receiveToken);
        _requireSupported(intent.payToken);
    }

    function _settle(Order calldata order, Intent calldata intent) private {
        uint256 receiveBalanceBefore = IERC20(order.receiveToken).balanceOf(address(this));
        uint256 payAmount = _collect(order, intent);
        uint256 received = IERC20(order.receiveToken).balanceOf(address(this)) - receiveBalanceBefore;
        (uint256 fee, address payout) = _distribute(order, received);
        emit PaymentSettled(
            order.merchant,
            order.orderId,
            intent.payer,
            intent.payToken,
            payAmount,
            order.receiveToken,
            order.receiveAmount,
            fee,
            payout
        );
    }

    /// @dev Pulls exactly what the route needs from the payer and swaps it into at least `order.receiveAmount`.
    function _collect(Order calldata order, Intent calldata intent) private returns (uint256 payAmount) {
        if (intent.payToken == order.receiveToken) {
            payAmount = order.receiveAmount;
            _pull(intent, payAmount);
            return payAmount;
        }

        // USDT0 has no pool, so a zero pool marks the USDT0 side of the route.
        address payPool = poolOf[intent.payToken];
        address receivePool = poolOf[order.receiveToken];
        uint256 usdt0Needed = receivePool == address(0)
            ? order.receiveAmount
            : _quote(receivePool, USDT0_COIN_INDEX, TWIN_COIN_INDEX, order.receiveAmount);
        payAmount =
            payPool == address(0) ? usdt0Needed : _quote(payPool, TWIN_COIN_INDEX, USDT0_COIN_INDEX, usdt0Needed);
        _pull(intent, payAmount);

        uint256 usdt0Amount = payPool == address(0)
            ? payAmount
            : ICurveTwocrypto(payPool).exchange(TWIN_COIN_INDEX, USDT0_COIN_INDEX, payAmount, usdt0Needed);
        if (receivePool != address(0)) {
            ICurveTwocrypto(receivePool).exchange(USDT0_COIN_INDEX, TWIN_COIN_INDEX, usdt0Amount, order.receiveAmount);
        }
    }

    function _pull(Intent calldata intent, uint256 amount) private {
        if (amount > intent.maxPayAmount) revert MaxPayExceeded();
        IERC20(intent.payToken).safeTransferFrom(intent.payer, address(this), amount);
    }

    function _quote(address pool, uint256 i, uint256 j, uint256 dy) private view returns (uint256) {
        return ICurveTwocrypto(pool).get_dx(i, j, dy) * (BPS_DENOMINATOR + GET_DX_BUFFER_BPS) / BPS_DENOMINATOR;
    }

    /// @dev Swap surplus above `receiveAmount` goes to the treasury with the fee so the router keeps nothing.
    function _distribute(Order calldata order, uint256 received) private returns (uint256 fee, address payout) {
        fee = order.receiveAmount * feeBps / BPS_DENOMINATOR;
        payout = payoutAddressOf[order.merchant];
        if (payout == address(0)) payout = order.merchant;
        IERC20 receiveToken = IERC20(order.receiveToken);
        receiveToken.safeTransfer(treasury, received - order.receiveAmount + fee);
        receiveToken.safeTransfer(payout, order.receiveAmount - fee);
    }

    function _tryPermit(Intent calldata intent, PermitData calldata permit) private {
        // A front-run permit would make this call revert; the allowance it set still lets transferFrom succeed.
        try IERC20Permit(intent.payToken)
            .permit(intent.payer, address(this), permit.value, permit.deadline, permit.v, permit.r, permit.s) {}
            catch {}
    }

    function _requireSupported(address token) private view {
        if (token != address(usdt0) && poolOf[token] == address(0)) revert UnsupportedToken(token);
    }

    function _setFeeBps(uint16 newFeeBps) private {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeBps = newFeeBps;
        emit FeeBpsSet(newFeeBps);
    }

    function _setTreasury(address newTreasury) private {
        if (newTreasury == address(0)) revert ZeroAddress();
        treasury = newTreasury;
        emit TreasurySet(newTreasury);
    }

    function _setPool(address twinToken, address pool) private {
        address oldPool = poolOf[twinToken];
        if (oldPool != address(0)) {
            IERC20(twinToken).forceApprove(oldPool, 0);
            usdt0.forceApprove(oldPool, 0);
        }
        if (pool != address(0)) {
            ICurveTwocrypto curvePool = ICurveTwocrypto(pool);
            if (curvePool.coins(TWIN_COIN_INDEX) != twinToken || curvePool.coins(USDT0_COIN_INDEX) != address(usdt0)) {
                revert PoolMismatch();
            }
            IERC20(twinToken).forceApprove(pool, type(uint256).max);
            usdt0.forceApprove(pool, type(uint256).max);
        }
        poolOf[twinToken] = pool;
        emit PoolSet(twinToken, pool);
    }
}
