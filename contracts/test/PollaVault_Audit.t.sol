// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VaultFactory.sol";
import "../src/PollaVault.sol";
import "./MockUSDC.sol";

/**
 * @title PollaVaultAuditTest
 * @dev Suite de pruebas de seguridad y lógica para PollaVault.sol (Rol: @auditor).
 */
contract PollaVaultAuditTest is Test {
    VaultFactory public factory;
    PollaVault public implementation;
    MockUSDC public usdc;

    address public admin = address(0xAD);
    address public creator = address(0x1337);
    address public hacker = address(0xBAD);
    
    uint256 public constant ENTRY_COST = 100 * 10**6; // 100 USDC

    function setUp() public {
        vm.startPrank(admin);
        usdc = new MockUSDC();
        implementation = new PollaVault();
        factory = new VaultFactory(address(implementation), address(usdc));
        vm.stopPrank();
    }

    /**
     * @dev Escenario 1: El Límite Estricto (15 Participantes).
     */
    function test_Audit_MaxParticipantsLimit() public {
        vm.prank(creator);
        address vaultAddr = factory.createVault(ENTRY_COST);
        PollaVault vault = PollaVault(vaultAddr);

        // Ingresar 15 participantes exitosamente
        for (uint160 i = 1; i <= 15; i++) {
            address user = address(uint160(0x1000 + i));
            usdc.mint(user, ENTRY_COST);
            vm.startPrank(user);
            usdc.approve(address(vault), ENTRY_COST);
            vault.joinTournament();
            vm.stopPrank();
        }

        assertEq(vault.participantsCount(), 15, "Deberia haber 15 participantes");

        // Intentar ingresar el participante 16 (DEBE FALLAR)
        address user16 = address(0x1016);
        usdc.mint(user16, ENTRY_COST);
        vm.startPrank(user16);
        usdc.approve(address(vault), ENTRY_COST);
        
        vm.expectRevert("Cupo completo");
        vault.joinTournament();
        vm.stopPrank();
        
        console.log("SUCCESS: Escenario 1 - Limite de 15 participantes verificado.");
    }

    /**
     * @dev Escenario 2: Seguridad del Oráculo (Access Control).
     */
    function test_Audit_OracleAccessControl() public {
        vm.prank(creator);
        address vaultAddr = factory.createVault(ENTRY_COST);
        PollaVault vault = PollaVault(vaultAddr);

        address[] memory winners = new address[](1);
        winners[0] = address(0x1);
        uint256[] memory payouts = new uint256[](1);
        payouts[0] = 100;

        // Hacker intenta resolver el torneo (DEBE FALLAR)
        vm.prank(hacker);
        vm.expectRevert("Solo Admin");
        vault.resolveTournament(winners, payouts);

        console.log("SUCCESS: Escenario 2 - Hacker no pudo resolver el torneo.");
    }

    /**
     * @dev Escenario 3: Matemática y Comisiones (1% Fee, 70/30 Split).
     */
    function test_Audit_MathematicalIntegrity() public {
        vm.prank(creator);
        address vaultAddr = factory.createVault(ENTRY_COST);
        PollaVault vault = PollaVault(vaultAddr);

        // Unir 10 participantes = 1000 USDC Pool
        for (uint160 i = 1; i <= 10; i++) {
            address user = address(uint160(0x2000 + i));
            usdc.mint(user, ENTRY_COST);
            vm.startPrank(user);
            usdc.approve(address(vault), ENTRY_COST);
            vault.joinTournament();
            vm.stopPrank();
        }

        uint256 totalPool = vault.totalPool(); // 1000 USDC
        assertEq(totalPool, 1000 * 10**6);

        address winner = address(0x3000);
        address[] memory winners = new address[](1);
        winners[0] = winner;
        uint256[] memory payouts = new uint256[](1);
        payouts[0] = 990 * 10**6;

        uint256 adminPre = usdc.balanceOf(admin);
        uint256 creatorPre = usdc.balanceOf(creator);
        uint256 winnerPre = usdc.balanceOf(winner);

        vm.prank(admin);
        vault.resolveTournament(winners, payouts);

        // Intentar ejecutar pago antes de tiempo (DEBE FALLAR)
        vm.expectRevert("En periodo de disputa");
        vault.executePayout();

        // Adelantar tiempo 25 horas
        skip(25 hours);

        vault.executePayout();

        // Verificaciones
        assertEq(usdc.balanceOf(admin) - adminPre, 7 * 10**6, "Admin deberia recibir 7 USDC (70% del 1%)");
        assertEq(usdc.balanceOf(creator) - creatorPre, 3 * 10**6, "Creador deberia recibir 3 USDC (30% del 1%)");
        assertEq(usdc.balanceOf(winner) - winnerPre, 990 * 10**6, "Ganador deberia recibir 990 USDC");

        console.log("SUCCESS: Escenario 3 - Matematica de comisiones y Timelock verificados.");
    }

    /**
     * @dev Escenario 4: Corrección de Emergencia durante Disputa.
     */
    function test_Audit_EmergencyCorrection() public {
        vm.prank(creator);
        address vaultAddr = factory.createVault(ENTRY_COST);
        PollaVault vault = PollaVault(vaultAddr);

        usdc.mint(address(0x1), ENTRY_COST);
        vm.startPrank(address(0x1));
        usdc.approve(address(vault), ENTRY_COST);
        vault.joinTournament();
        vm.stopPrank();

        address[] memory initialWinners = new address[](1);
        initialWinners[0] = address(0xBAD);
        uint256[] memory initialPayouts = new uint256[](1);
        initialPayouts[0] = 99 * 10**6;

        vm.prank(admin);
        vault.resolveTournament(initialWinners, initialPayouts);

        // Corregir a ganador real
        address[] memory realWinners = new address[](1);
        realWinners[0] = address(0xC0DE);
        uint256[] memory realPayouts = new uint256[](1);
        realPayouts[0] = 99 * 10**6;

        vm.prank(admin);
        vault.emergencyCorrection(realWinners, realPayouts);

        skip(25 hours);
        vault.executePayout();

        assertEq(usdc.balanceOf(address(0xC0DE)), 99 * 10**6, "El ganador real deberia recibir el pago");
        assertEq(usdc.balanceOf(address(0xBAD)), 0, "El ganador incorrecto no deberia recibir nada");

        console.log("SUCCESS: Escenario 4 - Correccion de emergencia verificada.");
    }
}
