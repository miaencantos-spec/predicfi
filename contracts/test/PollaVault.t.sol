// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VaultFactory.sol";
import "../src/PollaVault.sol";
import "./MockUSDC.sol";

contract PollaVaultTest is Test {
    VaultFactory public factory;
    PollaVault public implementation;
    MockUSDC public usdc;

    address public admin = address(1);
    address public creator = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public user3 = address(5);

    function setUp() public {
        vm.startPrank(admin);
        usdc = new MockUSDC();
        implementation = new PollaVault();
        factory = new VaultFactory(address(implementation), address(usdc));
        vm.stopPrank();

        usdc.mint(user1, 100 * 10**6);
        usdc.mint(user2, 100 * 10**6);
        usdc.mint(user3, 100 * 10**6);
    }

    function testCreateVaultAndJoin() public {
        vm.startPrank(creator);
        address vaultAddr = factory.createVault(10 * 10**6);
        vm.stopPrank();

        PollaVault vault = PollaVault(vaultAddr);
        assertEq(vault.entryCost(), 10 * 10**6);
        assertEq(vault.creator(), creator);

        vm.startPrank(user1);
        usdc.approve(address(vault), 10 * 10**6);
        vault.joinTournament();
        vm.stopPrank();

        assertEq(vault.participantsCount(), 1);
        assertEq(vault.totalPool(), 10 * 10**6);
    }

    function testMaxParticipants() public {
        vm.prank(creator);
        address vaultAddr = factory.createVault(10 * 10**6);
        PollaVault vault = PollaVault(vaultAddr);

        for (uint160 i = 0; i < 15; i++) {
            address user = address(uint160(100 + i));
            usdc.mint(user, 10 * 10**6);
            vm.startPrank(user);
            usdc.approve(address(vault), 10 * 10**6);
            vault.joinTournament();
            vm.stopPrank();
        }

        assertEq(vault.participantsCount(), 15);

        // Intento de participante 16 debe fallar
        address user16 = address(999);
        usdc.mint(user16, 10 * 10**6);
        vm.startPrank(user16);
        usdc.approve(address(vault), 10 * 10**6);
        vm.expectRevert("Cupo completo");
        vault.joinTournament();
        vm.stopPrank();
    }

    function testResolutionAndFees() public {
        vm.prank(creator);
        address vaultAddr = factory.createVault(100 * 10**6); // 100 USDC entrada
        PollaVault vault = PollaVault(vaultAddr);

        // 3 Usuarios se unen = 300 USDC total pool
        address[] memory users = new address[](3);
        users[0] = user1;
        users[1] = user2;
        users[2] = user3;

        for (uint i = 0; i < 3; i++) {
            vm.startPrank(users[i]);
            usdc.approve(address(vault), 100 * 10**6);
            vault.joinTournament();
            vm.stopPrank();
        }

        // Resolución: 1 ganador se lleva todo el premio (menos fees)
        // Pool = 300 USDC
        // Fee (1%) = 3 USDC
        // Admin Share (70% de 3) = 2.1 USDC
        // Creator Share (30% de 3) = 0.9 USDC
        // Reward = 300 - 3 = 297 USDC

        address[] memory winners = new address[](1);
        winners[0] = user1;
        uint256[] memory payouts = new uint256[](1);
        payouts[0] = 297 * 10**6;

        uint256 adminBalanceBefore = usdc.balanceOf(admin);
        uint256 creatorBalanceBefore = usdc.balanceOf(creator);
        uint256 winnerBalanceBefore = usdc.balanceOf(user1);

        vm.prank(admin);
        vault.resolveTournament(winners, payouts);

        assertEq(usdc.balanceOf(admin) - adminBalanceBefore, 2.1 * 10**6);
        assertEq(usdc.balanceOf(creator) - creatorBalanceBefore, 0.9 * 10**6);
        assertEq(usdc.balanceOf(user1) - winnerBalanceBefore, 297 * 10**6);
        assertTrue(vault.resolved());
    }
}
