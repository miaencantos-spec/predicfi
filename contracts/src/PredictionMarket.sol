// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IFactory {
    function handleFee(uint256 _totalFee) external;
    function platformFee() external view returns (uint256);
}

contract PredictionMarket is Initializable {
    // 1. Estructura y Estado
    string public question;
    uint256 public endTime;
    address public creator;
    address public usdc;
    address public factory;
    
    bool public resolved;
    bool public finalOutcome; // true = SI, false = NO
    uint256 public resolvedAt;
    uint256 public constant DISPUTE_PERIOD = 24 hours;
    
    uint256 public totalYesShares;
    uint256 public totalNoShares;
    uint256 public totalPool;

    // Mapeos de participación
    mapping(address => uint256) public yesShares;
    mapping(address => uint256) public noShares;
    mapping(address => bool) public hasClaimed;

    event SharesBought(address indexed user, bool outcome, uint256 amount, uint256 shares);
    event MarketSettled(bool outcome, uint8 confidence);
    event Claimed(address indexed user, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // 2. Inicialización (Para el Clon EIP-1167)
    function initialize(
        string memory _question, 
        uint256 _endTime, 
        address _creator, 
        address _usdc
    ) external initializer {
        question = _question;
        endTime = _endTime;
        creator = _creator;
        usdc = _usdc;
        factory = msg.sender;
    }

    // 3. Compra de Shares con Permit (UX Premium)
    function buySharesWithPermit(
        bool _outcome,
        uint256 _amount,
        uint256 _deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        IERC20(usdc).permit(msg.sender, address(this), _amount, _deadline, v, r, s);
        buyShares(_outcome, _amount);
    }

    function buyShares(bool _outcome, uint256 _amount) public {
        require(block.timestamp < endTime, "Mercado cerrado");
        require(!resolved, "Mercado ya resuelto");
        require(IERC20(usdc).transferFrom(msg.sender, address(this), _amount), "Fallo transferencia");

        if (_outcome) {
            yesShares[msg.sender] += _amount;
            totalYesShares += _amount;
        } else {
            noShares[msg.sender] += _amount;
            totalNoShares += _amount;
        }
        
        totalPool += _amount;
        emit SharesBought(msg.sender, _outcome, _amount, _amount);
    }

    // 4. Resolución (Settle)
    function settle(bool _outcome, uint8 _confidence) external {
        require(msg.sender == factory, "Solo via Factory");
        require(block.timestamp >= endTime, "Aun no expira");
        require(!resolved, "Ya resuelto");

        resolved = true;
        resolvedAt = block.timestamp;
        finalOutcome = _outcome;
        emit MarketSettled(_outcome, _confidence);
    }

    // Nueva función para corregir (Solo via Factory/Admin)
    function emergencyCorrection(bool _newOutcome) external {
        require(msg.sender == factory, "Solo via Factory");
        require(resolved, "No resuelto aun");
        require(block.timestamp <= resolvedAt + DISPUTE_PERIOD, "Periodo de disputa cerrado");
        
        finalOutcome = _newOutcome;
    }

    // 5. Reclamo de Ganancias con Timelock de 24h
    function claim() external {
        require(resolved, "No resuelto");
        require(block.timestamp > resolvedAt + DISPUTE_PERIOD, "En periodo de disputa (24h)");
        require(!hasClaimed[msg.sender], "Ya reclamaste");

        uint256 userShares = finalOutcome ? yesShares[msg.sender] : noShares[msg.sender];
        require(userShares > 0, "No ganaste nada");

        uint256 winningPool = finalOutcome ? totalYesShares : totalNoShares;
        
        // Cálculo de recompensa proporcional
        uint256 reward = (userShares * totalPool) / winningPool;

        // Aplicar Comisiones dinámicas desde la Factory (Basis Points)
        uint256 feeBps = IFactory(factory).platformFee();
        uint256 fee = (reward * feeBps) / 10000; 
        uint256 netReward = reward - fee;

        hasClaimed[msg.sender] = true;
        require(IERC20(usdc).transfer(msg.sender, netReward), "Fallo pago");
        
        // Enviar comisiones a la Factory para el split 70/30
        require(IERC20(usdc).transfer(factory, fee), "Fallo comision");
        IFactory(factory).handleFee(fee);

        emit Claimed(msg.sender, netReward);
    }
}
