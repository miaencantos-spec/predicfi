// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PollaVault.sol";
import "../src/VaultFactory.sol";

/**
 * @title DeployPolla
 * @dev Script para desplegar la infraestructura de Pollas Futboleras en Base Sepolia.
 */
contract DeployPolla is Script {
    // Dirección de USDC en Base Sepolia (según stack.md)
    address public constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Desplegar la implementación de la Bóveda (Logic)
        PollaVault implementation = new PollaVault();
        console.log("PollaVault Implementation deployed at:", address(implementation));

        // 2. Desplegar la Fábrica de Bóvedas
        VaultFactory factory = new VaultFactory(address(implementation), USDC_BASE_SEPOLIA);
        console.log("VaultFactory deployed at:", address(factory));

        vm.stopBroadcast();

        console.log("----------------------------------------------");
        console.log("Deployment Complete!");
        console.log("Admin Address:", deployerAddress);
        console.log("USDC Address:", USDC_BASE_SEPOLIA);
        console.log("----------------------------------------------");
    }
}
