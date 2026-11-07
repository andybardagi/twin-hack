// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {PaymentRouter} from "../src/PaymentRouter.sol";

contract DeployTest is Test {
    string constant DEFAULT_RPC_URL = "https://arb1.arbitrum.io/rpc";
    uint256 constant DEPLOYER_KEY = 0xA11CE;
    uint16 constant FEE_BPS = 50;
    address constant USDT0 = 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9;

    /// @dev Forks the latest block unless FORK_BLOCK is set (needs an archive RPC for older blocks).
    function _fork() internal {
        string memory rpcUrl = vm.envOr("ARBITRUM_RPC_URL", DEFAULT_RPC_URL);
        uint256 forkBlock = vm.envOr("FORK_BLOCK", uint256(0));
        if (forkBlock == 0) vm.createSelectFork(rpcUrl);
        else vm.createSelectFork(rpcUrl, forkBlock);
    }

    function test_deploysWithAllTwinPools() public {
        _fork();
        vm.setEnv("DEPLOYER_PRIVATE_KEY", vm.toString(DEPLOYER_KEY));
        PaymentRouter router = new Deploy().run();

        address deployer = vm.addr(DEPLOYER_KEY);
        assertEq(router.owner(), deployer);
        assertEq(router.treasury(), deployer);
        assertEq(router.feeBps(), FEE_BPS);
        assertEq(address(router.usdt0()), USDT0);

        // Expected pairs copied from the README table, independently of the script's constants.
        address[2][7] memory expected = [
            [0x59863989d080B22476DB95656d0C3CC18be92214, 0x356D349dA9ADd7Efb56a35fAB939A2c6D852f853],
            [0xC4ed6Aba5373D78E160F4df39e011F078Be54df8, 0xEef48Df5F1c509cD9730774b4e8A4464626ef8D5],
            [0xa16d5DB80A45157E0e451750B81FF0CC0b61d558, 0x7D2dFfa9e903b8377c96196dA424C7965b06BCc3],
            [0x899438713f62B04d6CD8e8709986F7256fB6E3d9, 0x41af8cC0811DD07F167752B821CF5B11DBa7Ca85],
            [0xb96aA6babCcD738d6644ADd4912fE5eFbEBF5a25, 0x6EdBF3adA7B6D9524c3248955538D573AAE449CF],
            [0xe8dbC4680235cCAeFf48e4C0B0EaceeBb89E5e17, 0xA087f05ecD245476d7844f6eab28D98724696ac2],
            [0x1edF5E61B6a4Fe19FEf3A695328F61aAa07728eA, 0x9c7809c813BcC67e288c56d5Ce5e0225996bFcD2]
        ];
        for (uint256 i; i < expected.length; ++i) {
            assertEq(router.poolOf(expected[i][0]), expected[i][1]);
        }
    }
}
