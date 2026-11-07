// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {Vm} from "forge-std/Vm.sol";
import {ICurveTwocrypto, PaymentRouter} from "../src/PaymentRouter.sol";

contract PaymentRouterTest is Test {
    uint256 constant FORK_BLOCK = 522_117_000;
    string constant DEFAULT_RPC_URL = "https://arb1.arbitrum.io/rpc";

    IERC20 constant USDT0 = IERC20(0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9);
    IERC20 constant ARGT = IERC20(0x59863989d080B22476DB95656d0C3CC18be92214);
    address constant ARGT_POOL = 0x356D349dA9ADd7Efb56a35fAB939A2c6D852f853;
    IERC20 constant BRAT = IERC20(0xC4ed6Aba5373D78E160F4df39e011F078Be54df8);
    address constant BRAT_POOL = 0xEef48Df5F1c509cD9730774b4e8A4464626ef8D5;
    IERC20 constant COLT = IERC20(0xa16d5DB80A45157E0e451750B81FF0CC0b61d558);
    address constant COLT_POOL = 0x7D2dFfa9e903b8377c96196dA424C7965b06BCc3;
    bytes32 constant PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    uint16 constant FEE_BPS = 50;
    uint256 constant USDT0_AMOUNT = 1e6;
    uint256 constant ARGT_AMOUNT = 15_000e18;
    uint256 constant BRAT_FUNDING = 1_000e18;
    uint256 constant MAX_PAY_SLIPPAGE_BPS = 100;
    uint64 constant ORDER_TTL = 10 minutes;

    PaymentRouter router;
    address owner = makeAddr("owner");
    address treasury = makeAddr("treasury");
    address merchant = makeAddr("merchant");
    address forward = makeAddr("forward");
    uint256 merchantKeyPk;
    address merchantKey;
    uint256 payerPk;
    address payer;

    function setUp() public {
        vm.createSelectFork(vm.envOr("ARBITRUM_RPC_URL", DEFAULT_RPC_URL), FORK_BLOCK);
        (merchantKey, merchantKeyPk) = makeAddrAndKey("merchantKey");
        (payer, payerPk) = makeAddrAndKey("payer");

        address[] memory tokens = new address[](2);
        address[] memory pools = new address[](2);
        tokens[0] = address(ARGT);
        pools[0] = ARGT_POOL;
        tokens[1] = address(BRAT);
        pools[1] = BRAT_POOL;
        // Salted so the router doesn't land on the default test-deploy address, which holds dust on mainnet.
        router = new PaymentRouter{salt: keccak256("PaymentRouter")}(owner, treasury, FEE_BPS, USDT0, tokens, pools);

        vm.prank(merchant);
        router.setSigningKey(merchantKey);

        _fund(USDT0, ARGT_POOL, payer, USDT0_AMOUNT * 10);
        _fund(ARGT, ARGT_POOL, payer, ARGT_AMOUNT * 10);
        _fund(BRAT, BRAT_POOL, payer, BRAT_FUNDING);
        vm.startPrank(payer);
        USDT0.approve(address(router), type(uint256).max);
        ARGT.approve(address(router), type(uint256).max);
        BRAT.approve(address(router), type(uint256).max);
        vm.stopPrank();
    }

    // USDT0 is an upgradeable proxy where `deal` is unreliable, so funds come from a real holder.
    function _fund(IERC20 token, address holder, address to, uint256 amount) internal {
        vm.prank(holder);
        assertTrue(token.transfer(to, amount));
    }

    function _order(IERC20 token, uint256 amount, bytes32 orderId) internal view returns (PaymentRouter.Order memory) {
        return PaymentRouter.Order({
            merchant: merchant,
            receiveToken: address(token),
            receiveAmount: amount,
            orderId: orderId,
            expiry: uint64(block.timestamp) + ORDER_TTL
        });
    }

    function _intent(PaymentRouter.Order memory order, IERC20 payToken, uint256 maxPay)
        internal
        view
        returns (PaymentRouter.Intent memory)
    {
        return PaymentRouter.Intent({
            payer: payer, payToken: address(payToken), maxPayAmount: maxPay, orderHash: router.hashOrder(order)
        });
    }

    function _sign(uint256 pk, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _noPermit() internal pure returns (PaymentRouter.PermitData memory permit) {}

    function _pay(PaymentRouter.Order memory order, PaymentRouter.Intent memory intent) internal {
        router.pay(
            order,
            _sign(merchantKeyPk, router.hashOrder(order)),
            intent,
            _sign(payerPk, router.hashIntent(intent)),
            _noPermit()
        );
    }

    function _payExpectRevert(PaymentRouter.Order memory order, PaymentRouter.Intent memory intent, bytes memory err)
        internal
    {
        bytes memory merchantSig = _sign(merchantKeyPk, router.hashOrder(order));
        bytes memory payerSig = _sign(payerPk, router.hashIntent(intent));
        vm.expectRevert(err);
        router.pay(order, merchantSig, intent, payerSig, _noPermit());
    }

    function _assertSameTokenSettles(IERC20 token, uint256 amount, address expectedPayout) internal {
        PaymentRouter.Order memory order = _order(token, amount, keccak256("order-1"));
        PaymentRouter.Intent memory intent = _intent(order, token, amount);
        uint256 fee = amount * FEE_BPS / 10_000;
        uint256 payerBefore = token.balanceOf(payer);
        uint256 treasuryBefore = token.balanceOf(treasury);
        uint256 payoutBefore = token.balanceOf(expectedPayout);

        vm.expectEmit(address(router));
        emit PaymentRouter.PaymentSettled(
            merchant, order.orderId, payer, address(token), amount, address(token), amount, fee, expectedPayout
        );
        _pay(order, intent);

        assertEq(token.balanceOf(payer), payerBefore - amount);
        assertEq(token.balanceOf(treasury), treasuryBefore + fee);
        assertEq(token.balanceOf(expectedPayout), payoutBefore + amount - fee);
        assertEq(token.balanceOf(address(router)), 0);
        assertTrue(router.paid(merchant, order.orderId));
    }

    struct Balances {
        uint256 payerPayToken;
        uint256 merchantReceiveToken;
        uint256 treasuryReceiveToken;
    }

    function _withSlippage(uint256 amount) internal pure returns (uint256) {
        return amount * (10_000 + MAX_PAY_SLIPPAGE_BPS) / 10_000;
    }

    function _signPermit(uint256 value) internal view returns (PaymentRouter.PermitData memory permit) {
        IERC20Permit usdt0Permit = IERC20Permit(address(USDT0));
        permit.value = value;
        permit.deadline = block.timestamp + ORDER_TTL;
        bytes32 structHash = keccak256(
            abi.encode(PERMIT_TYPEHASH, payer, address(router), value, usdt0Permit.nonces(payer), permit.deadline)
        );
        (permit.v, permit.r, permit.s) =
            vm.sign(payerPk, keccak256(abi.encodePacked("\x19\x01", usdt0Permit.DOMAIN_SEPARATOR(), structHash)));
    }

    function _balances(IERC20 payToken, IERC20 receiveToken) internal view returns (Balances memory) {
        return Balances({
            payerPayToken: payToken.balanceOf(payer),
            merchantReceiveToken: receiveToken.balanceOf(merchant),
            treasuryReceiveToken: receiveToken.balanceOf(treasury)
        });
    }

    function _settledPayAmount() internal returns (uint256 payAmount) {
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint256 i; i < logs.length; ++i) {
            if (logs[i].emitter == address(router) && logs[i].topics[0] == PaymentRouter.PaymentSettled.selector) {
                (, payAmount) = abi.decode(logs[i].data, (address, uint256));
                return payAmount;
            }
        }
        revert("PaymentSettled not emitted");
    }

    function _assertSwapSettles(
        IERC20 payToken,
        IERC20 receiveToken,
        uint256 receiveAmount,
        uint256 maxPay,
        PaymentRouter.PermitData memory permit
    ) internal {
        PaymentRouter.Order memory order = _order(receiveToken, receiveAmount, keccak256("order-1"));
        PaymentRouter.Intent memory intent = _intent(order, payToken, maxPay);
        bytes memory merchantSig = _sign(merchantKeyPk, router.hashOrder(order));
        bytes memory payerSig = _sign(payerPk, router.hashIntent(intent));
        Balances memory before = _balances(payToken, receiveToken);

        vm.recordLogs();
        router.pay(order, merchantSig, intent, payerSig, permit);
        uint256 payAmount = _settledPayAmount();

        Balances memory afterPay = _balances(payToken, receiveToken);
        uint256 fee = receiveAmount * FEE_BPS / 10_000;
        assertEq(afterPay.merchantReceiveToken - before.merchantReceiveToken, receiveAmount - fee);
        assertGe(afterPay.treasuryReceiveToken - before.treasuryReceiveToken, fee);
        assertEq(before.payerPayToken - afterPay.payerPayToken, payAmount);
        assertLe(payAmount, maxPay);
        assertEq(payToken.balanceOf(address(router)), 0);
        assertEq(receiveToken.balanceOf(address(router)), 0);
        assertEq(USDT0.balanceOf(address(router)), 0);
    }

    function test_settlesUsdt0ToMerchant() public {
        _assertSameTokenSettles(USDT0, USDT0_AMOUNT, merchant);
    }

    function test_settlesArgtToMerchant() public {
        _assertSameTokenSettles(ARGT, ARGT_AMOUNT, merchant);
    }

    function test_settlesToForwardAddress() public {
        vm.prank(merchant);
        router.setPayoutAddress(forward);
        _assertSameTokenSettles(USDT0, USDT0_AMOUNT, forward);
        assertEq(USDT0.balanceOf(merchant), 0);
    }

    function test_clearingForwardAddressPaysMerchant() public {
        vm.startPrank(merchant);
        router.setPayoutAddress(forward);
        router.setPayoutAddress(address(0));
        vm.stopPrank();
        _assertSameTokenSettles(USDT0, USDT0_AMOUNT, merchant);
    }

    function test_revertsReplayedOrderId() public {
        PaymentRouter.Order memory order = _order(USDT0, USDT0_AMOUNT, keccak256("order-1"));
        PaymentRouter.Intent memory intent = _intent(order, USDT0, USDT0_AMOUNT);
        _pay(order, intent);
        _payExpectRevert(order, intent, abi.encodeWithSelector(PaymentRouter.OrderAlreadyPaid.selector));
    }

    function test_revertsExpiredOrder() public {
        PaymentRouter.Order memory order = _order(USDT0, USDT0_AMOUNT, keccak256("order-1"));
        PaymentRouter.Intent memory intent = _intent(order, USDT0, USDT0_AMOUNT);
        vm.warp(order.expiry + 1);
        _payExpectRevert(order, intent, abi.encodeWithSelector(PaymentRouter.OrderExpired.selector));
    }

    function test_revertsWrongMerchantKey() public {
        (, uint256 otherPk) = makeAddrAndKey("other");
        PaymentRouter.Order memory order = _order(USDT0, USDT0_AMOUNT, keccak256("order-1"));
        PaymentRouter.Intent memory intent = _intent(order, USDT0, USDT0_AMOUNT);
        bytes memory merchantSig = _sign(otherPk, router.hashOrder(order));
        bytes memory payerSig = _sign(payerPk, router.hashIntent(intent));
        vm.expectRevert(PaymentRouter.InvalidMerchantSignature.selector);
        router.pay(order, merchantSig, intent, payerSig, _noPermit());
    }

    function test_revertsRevokedKey() public {
        vm.prank(merchant);
        router.setSigningKey(address(0));
        PaymentRouter.Order memory order = _order(USDT0, USDT0_AMOUNT, keccak256("order-1"));
        _payExpectRevert(
            order,
            _intent(order, USDT0, USDT0_AMOUNT),
            abi.encodeWithSelector(PaymentRouter.InvalidMerchantSignature.selector)
        );
    }

    function test_revertsTamperedOrder() public {
        PaymentRouter.Order memory order = _order(USDT0, USDT0_AMOUNT, keccak256("order-1"));
        PaymentRouter.Intent memory intent = _intent(order, USDT0, USDT0_AMOUNT);
        bytes memory merchantSig = _sign(merchantKeyPk, router.hashOrder(order));
        bytes memory payerSig = _sign(payerPk, router.hashIntent(intent));
        order.receiveAmount = 1;
        vm.expectRevert(PaymentRouter.InvalidMerchantSignature.selector);
        router.pay(order, merchantSig, intent, payerSig, _noPermit());
    }

    function test_revertsTamperedIntent() public {
        PaymentRouter.Order memory order = _order(USDT0, USDT0_AMOUNT, keccak256("order-1"));
        PaymentRouter.Intent memory intent = _intent(order, USDT0, USDT0_AMOUNT);
        bytes memory merchantSig = _sign(merchantKeyPk, router.hashOrder(order));
        bytes memory payerSig = _sign(payerPk, router.hashIntent(intent));
        intent.maxPayAmount = USDT0_AMOUNT * 2;
        vm.expectRevert(PaymentRouter.InvalidPayerSignature.selector);
        router.pay(order, merchantSig, intent, payerSig, _noPermit());
    }

    function test_revertsIntentForOtherOrder() public {
        PaymentRouter.Order memory order = _order(USDT0, USDT0_AMOUNT, keccak256("order-1"));
        PaymentRouter.Order memory otherOrder = _order(USDT0, USDT0_AMOUNT, keccak256("order-2"));
        _payExpectRevert(
            order,
            _intent(otherOrder, USDT0, USDT0_AMOUNT),
            abi.encodeWithSelector(PaymentRouter.OrderHashMismatch.selector)
        );
    }

    function test_revertsWhenMaxPayBelowReceiveAmount() public {
        PaymentRouter.Order memory order = _order(USDT0, USDT0_AMOUNT, keccak256("order-1"));
        _payExpectRevert(
            order,
            _intent(order, USDT0, USDT0_AMOUNT - 1),
            abi.encodeWithSelector(PaymentRouter.MaxPayExceeded.selector)
        );
    }

    function test_revertsWhenMaxPayBelowSwapQuote() public {
        PaymentRouter.Order memory order = _order(ARGT, ARGT_AMOUNT, keccak256("order-1"));
        uint256 unbufferedQuote = ICurveTwocrypto(ARGT_POOL).get_dx(1, 0, ARGT_AMOUNT);
        _payExpectRevert(
            order, _intent(order, USDT0, unbufferedQuote), abi.encodeWithSelector(PaymentRouter.MaxPayExceeded.selector)
        );
    }

    function test_revertsUnsupportedPayToken() public {
        PaymentRouter.Order memory order = _order(USDT0, USDT0_AMOUNT, keccak256("order-1"));
        _payExpectRevert(
            order,
            _intent(order, COLT, ARGT_AMOUNT),
            abi.encodeWithSelector(PaymentRouter.UnsupportedToken.selector, address(COLT))
        );
    }

    function test_rejectsRouterAsPayout() public {
        vm.prank(merchant);
        vm.expectRevert(PaymentRouter.InvalidPayout.selector);
        router.setPayoutAddress(address(router));
    }

    function test_settlesUsdt0ToArgtWithPermit() public {
        vm.prank(payer);
        USDT0.approve(address(router), 0);
        uint256 maxPay = _withSlippage(ICurveTwocrypto(ARGT_POOL).get_dx(1, 0, ARGT_AMOUNT));
        _assertSwapSettles(USDT0, ARGT, ARGT_AMOUNT, maxPay, _signPermit(maxPay));
    }

    function test_settlesWhenPermitWasFrontRun() public {
        vm.prank(payer);
        USDT0.approve(address(router), 0);
        uint256 maxPay = _withSlippage(ICurveTwocrypto(ARGT_POOL).get_dx(1, 0, ARGT_AMOUNT));
        PaymentRouter.PermitData memory permit = _signPermit(maxPay);
        IERC20Permit(address(USDT0))
            .permit(payer, address(router), permit.value, permit.deadline, permit.v, permit.r, permit.s);
        _assertSwapSettles(USDT0, ARGT, ARGT_AMOUNT, maxPay, permit);
    }

    function test_settlesArgtToUsdt0() public {
        uint256 maxPay = _withSlippage(ICurveTwocrypto(ARGT_POOL).get_dx(0, 1, USDT0_AMOUNT));
        _assertSwapSettles(ARGT, USDT0, USDT0_AMOUNT, maxPay, _noPermit());
    }

    function test_settlesBratToArgtInTwoHops() public {
        uint256 usdt0Needed = ICurveTwocrypto(ARGT_POOL).get_dx(1, 0, ARGT_AMOUNT);
        uint256 maxPay = _withSlippage(ICurveTwocrypto(BRAT_POOL).get_dx(0, 1, _withSlippage(usdt0Needed)));
        _assertSwapSettles(BRAT, ARGT, ARGT_AMOUNT, maxPay, _noPermit());
    }

    function test_feeCapEnforced() public {
        uint16 maxFeeBps = router.MAX_FEE_BPS();
        vm.startPrank(owner);
        router.setFeeBps(maxFeeBps);
        assertEq(router.feeBps(), maxFeeBps);
        vm.expectRevert(PaymentRouter.FeeTooHigh.selector);
        router.setFeeBps(maxFeeBps + 1);
        vm.stopPrank();
    }

    function test_onlyOwnerCanConfigure() public {
        address stranger = makeAddr("stranger");
        vm.startPrank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        router.setFeeBps(1);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        router.setTreasury(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        router.setPool(address(BRAT), BRAT_POOL);
        vm.stopPrank();
    }

    function test_setPoolRejectsMismatchedPool() public {
        vm.prank(owner);
        vm.expectRevert(PaymentRouter.PoolMismatch.selector);
        router.setPool(address(BRAT), ARGT_POOL);
    }

    function test_setPoolMovesApprovals() public {
        vm.startPrank(owner);
        router.setPool(address(COLT), COLT_POOL);
        assertEq(COLT.allowance(address(router), COLT_POOL), type(uint256).max);
        assertEq(USDT0.allowance(address(router), COLT_POOL), type(uint256).max);

        router.setPool(address(COLT), address(0));
        vm.stopPrank();
        assertEq(COLT.allowance(address(router), COLT_POOL), 0);
        assertEq(USDT0.allowance(address(router), COLT_POOL), 0);
        assertEq(USDT0.allowance(address(router), ARGT_POOL), type(uint256).max);
    }

    function test_removedPoolMakesTokenUnsupported() public {
        vm.prank(owner);
        router.setPool(address(ARGT), address(0));
        assertEq(router.poolOf(address(ARGT)), address(0));
        PaymentRouter.Order memory order = _order(ARGT, ARGT_AMOUNT, keccak256("order-1"));
        _payExpectRevert(
            order,
            _intent(order, ARGT, ARGT_AMOUNT),
            abi.encodeWithSelector(PaymentRouter.UnsupportedToken.selector, address(ARGT))
        );
    }
}
