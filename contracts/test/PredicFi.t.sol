// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MarketFactory.sol";
import "../src/PredictionMarket.sol";
import "./MockUSDC.sol";

contract PredicFiTest is Test {
    MarketFactory public factory;
    PredictionMarket public implementation;
    MockUSDC public usdc;

    address public admin = address(1);
    address public creator = address(2);
    address public bettorYes = address(3);
    address public bettorNo = address(4);

    function setUp() public {
        vm.startPrank(admin);
        usdc = new MockUSDC();
        implementation = new PredictionMarket();
        // Ajustado a 3 parámetros: implementation, usdc, creationStake (0)
        factory = new MarketFactory(address(implementation), address(usdc), 0);
        vm.stopPrank();

        // Fondos para todos (USDC tiene 6 decimales)
        usdc.mint(creator, 100 * 10**6);
        usdc.mint(bettorYes, 1000 * 10**6);
        usdc.mint(bettorNo, 1000 * 10**6);
    }

    function testFullFlow() public {
        // 1. CREACIÓN
        vm.startPrank(creator);
        usdc.approve(address(factory), 10 * 10**6);
        address marketAddr = factory.createMarket("Llegara BTC a 100k?", block.timestamp + 1 days);
        vm.stopPrank();

        PredictionMarket market = PredictionMarket(marketAddr);

        // 2. APUESTAS
        vm.startPrank(bettorYes);
        usdc.approve(address(market), 100 * 10**6);
        market.buyShares(true, 100 * 10**6);
        vm.stopPrank();

        vm.startPrank(bettorNo);
        usdc.approve(address(market), 100 * 10**6);
        market.buyShares(false, 100 * 10**6);
        vm.stopPrank();

        // 3. RESOLUCIÓN (Simulamos que pasa 1 día y gana el SÍ)
        vm.warp(block.timestamp + 2 days);
        vm.prank(admin);
        factory.settleMarket(address(market), true, 95); // A traves de la Factory

        // 4. RECLAMO
        vm.prank(bettorYes);
        market.claim();

        // 5. VERIFICACIÓN DE COMISIONES (Split 70/30)
        // El pool era de 200 USDC (100 YES + 100 NO).
        // La comisión del 1% (definida en PredictionMarket.sol) es 2 USDC.
        // Creator (30% de 2) = 0.6 USDC (600,000 unidades)
        // Admin (70% de 2) = 1.4 USDC (1,400,000 unidades)
        
        assertEq(factory.pendingIncentives(creator), 0.6 * 10**6);
        assertEq(factory.houseTreasury(), 1.4 * 10**6);
        
        console.log("Comision Creador:", factory.pendingIncentives(creator));
        console.log("Comision Admin:", factory.houseTreasury());
    }
}
