// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PaymentRouter} from "../src/PaymentRouter.sol";

contract Deploy is Script {
    uint16 constant FEE_BPS = 50;
    IERC20 constant USDT0 = IERC20(0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9);

    address constant ARGT = 0x59863989d080B22476DB95656d0C3CC18be92214;
    address constant ARGT_POOL = 0x356D349dA9ADd7Efb56a35fAB939A2c6D852f853;
    address constant BRAT = 0xC4ed6Aba5373D78E160F4df39e011F078Be54df8;
    address constant BRAT_POOL = 0xEef48Df5F1c509cD9730774b4e8A4464626ef8D5;
    address constant COLT = 0xa16d5DB80A45157E0e451750B81FF0CC0b61d558;
    address constant COLT_POOL = 0x7D2dFfa9e903b8377c96196dA424C7965b06BCc3;
    address constant PERT = 0x899438713f62B04d6CD8e8709986F7256fB6E3d9;
    address constant PERT_POOL = 0x41af8cC0811DD07F167752B821CF5B11DBa7Ca85;
    address constant MEXT = 0xb96aA6babCcD738d6644ADd4912fE5eFbEBF5a25;
    address constant MEXT_POOL = 0x6EdBF3adA7B6D9524c3248955538D573AAE449CF;
    address constant CHLT = 0xe8dbC4680235cCAeFf48e4C0B0EaceeBb89E5e17;
    address constant CHLT_POOL = 0xA087f05ecD245476d7844f6eab28D98724696ac2;
    address constant BOLT = 0x1edF5E61B6a4Fe19FEf3A695328F61aAa07728eA;
    address constant BOLT_POOL = 0x9c7809c813BcC67e288c56d5Ce5e0225996bFcD2;

    function run() external returns (PaymentRouter router) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address[] memory twinTokens = new address[](7);
        address[] memory pools = new address[](7);
        (twinTokens[0], pools[0]) = (ARGT, ARGT_POOL);
        (twinTokens[1], pools[1]) = (BRAT, BRAT_POOL);
        (twinTokens[2], pools[2]) = (COLT, COLT_POOL);
        (twinTokens[3], pools[3]) = (PERT, PERT_POOL);
        (twinTokens[4], pools[4]) = (MEXT, MEXT_POOL);
        (twinTokens[5], pools[5]) = (CHLT, CHLT_POOL);
        (twinTokens[6], pools[6]) = (BOLT, BOLT_POOL);

        vm.startBroadcast(deployerKey);
        router = new PaymentRouter(deployer, deployer, FEE_BPS, USDT0, twinTokens, pools);
        vm.stopBroadcast();
        console.log("PaymentRouter deployed at", address(router));
    }
}
