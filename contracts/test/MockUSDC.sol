// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title MockUSDC
 * @dev Contrato para pruebas locales que permite emitir tokens USDC falsos con soporte para Permit.
 */
contract MockUSDC is ERC20, ERC20Permit {
    constructor() ERC20("Mock USDC", "mUSDC") ERC20Permit("Mock USDC") {}

    /**
     * @dev Función para emitir tokens a cualquier dirección.
     * En producción esto no existiría o estaría restringido.
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    /**
     * @dev USDC real tiene 6 decimales. 
     * Ajustamos el mock para que los tests sean idénticos a la realidad.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
