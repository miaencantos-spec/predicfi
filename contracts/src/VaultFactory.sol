// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./PollaVault.sol";

/**
 * @title VaultFactory
 * @dev Fábrica para desplegar clones de PollaVault de forma eficiente.
 */
contract VaultFactory {
    address public immutable implementation;
    address public immutable usdc;
    address public admin;

    address[] public allVaults;
    mapping(address => bool) public isVault;

    event VaultCreated(address indexed vault, address indexed creator, uint256 entryCost);

    constructor(address _implementation, address _usdc) {
        implementation = _implementation;
        usdc = _usdc;
        admin = msg.sender;
    }

    /**
     * @dev Crea una nueva PollaVault (clon EIP-1167).
     * @param _entryCost Costo de entrada en USDC para este torneo.
     */
    function createVault(uint256 _entryCost) external returns (address) {
        address clone = Clones.clone(implementation);
        PollaVault(clone).initialize(usdc, admin, msg.sender, _entryCost);

        allVaults.push(clone);
        isVault[clone] = true;

        emit VaultCreated(clone, msg.sender, _entryCost);
        return clone;
    }

    function allVaultsLength() external view returns (uint256) {
        return allVaults.length;
    }

    /**
     * @dev Permite al admin cambiar la dirección administrativa de las futuras bóvedas.
     */
    function setAdmin(address _newAdmin) external {
        require(msg.sender == admin, "Solo Admin");
        admin = _newAdmin;
    }
}
