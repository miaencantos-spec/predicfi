// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MarketFactory.sol";
import "../src/PredictionMarket.sol";

contract DeployPredicFi is Script {
    function run() external {
        // Direcciones oficiales en Base Sepolia (USDC)
        address usdcSepolia = 0x036CbD53842c5426634e7929541eC2318f3dCF7e; 

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Desplegar el "Molde" (Implementación)
        PredictionMarket implementation = new PredictionMarket();

        // 2. Desplegar la "Fabrica" (Factory)
        // Usamos 0 como creationStake inicial
        MarketFactory factory = new MarketFactory(
            address(implementation), 
            usdcSepolia,
            0 
        );

        console.log("PredicFi Implementacion:", address(implementation));
        console.log("PredicFi Factory:", address(factory));

        vm.stopBroadcast();
    }
}
