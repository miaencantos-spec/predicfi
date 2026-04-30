// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IMarket.sol";

contract MarketFactory {
    address public immutable implementation;
    address public immutable usdc;
    address public admin;
    address public oracle; // El Agente de IA
    uint256 public creationStake;

    address[] public allMarkets;
    mapping(address => bool) public isMarket;
    mapping(address => address) public marketToCreator;
    mapping(address => uint256) public pendingIncentives; // Para los creadores (30%)
    uint256 public houseTreasury; // Tu 70%
    uint256 public platformFee = 100; // 100 = 1% (Basis Points)
    bool public paused;

    event MarketCreated(address indexed market, address indexed creator, string question);
    event FeeHandled(address indexed market, uint256 totalFee, uint256 creatorPart);
    event FactoryPaused(bool paused);
    event OracleSet(address indexed newOracle);
    event PlatformFeeUpdated(uint256 newFee);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Solo Admin");
        _;
    }

    modifier onlyOracleOrAdmin() {
        require(msg.sender == oracle || msg.sender == admin, "Solo Oracle o Admin");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Fabrica pausada");
        _;
    }

    constructor(address _implementation, address _usdc, uint256 _creationStake) {
        implementation = _implementation;
        usdc = _usdc;
        creationStake = _creationStake;
        admin = msg.sender;
        oracle = msg.sender; // Por defecto el Admin es el Oracle
    }

    // 1. Registro de creación
    function createMarket(string memory _question, uint256 _endTime) external whenNotPaused returns (address) {
        // En un flujo real, aquí podríamos cobrar el creationStake si se desea
        // require(IERC20(usdc).transferFrom(msg.sender, address(this), creationStake), "Stake fallido");
        
        address clone = Clones.clone(implementation);
        IMarket(clone).initialize(_question, _endTime, msg.sender, usdc);

        marketToCreator[clone] = msg.sender;
        isMarket[clone] = true;
        allMarkets.push(clone);

        emit MarketCreated(clone, msg.sender, _question);
        return clone;
    }

    function allMarketsLength() external view returns (uint256) {
        return allMarkets.length;
    }

    // 2. Recepción y Split de Comisiones
    // Esta función la llama el mercado en su claim()
    function handleFee(uint256 _totalFee) external {
        require(isMarket[msg.sender], "Solo mercados validos");
        
        address creator = marketToCreator[msg.sender];
        
        // Split 70/30 usando Basis Points
        uint256 creatorPart = (_totalFee * 3000) / 10000;
        uint256 housePart = _totalFee - creatorPart; // Evita perdida por redondeo

        pendingIncentives[creator] += creatorPart;
        houseTreasury += housePart;

        emit FeeHandled(msg.sender, _totalFee, creatorPart);
    }

    // 3. Retiro de Fondos
    function withdrawCreatorIncentives() external {
        uint256 amount = pendingIncentives[msg.sender];
        require(amount > 0, "No hay fondos");
        pendingIncentives[msg.sender] = 0;
        require(IERC20(usdc).transfer(msg.sender, amount), "Fallo retiro creador");
    }

    function withdrawHouseFees() external onlyAdmin {
        uint256 amount = houseTreasury;
        require(amount > 0, "No hay fees");
        houseTreasury = 0;
        require(IERC20(usdc).transfer(admin, amount), "Fallo retiro house");
    }

    // Ajustes de Admin e Intervención (Missing Link)
    function setPlatformFee(uint256 _newFee) external onlyAdmin {
        require(_newFee <= 500, "Max fee 5%");
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    function setCreationStake(uint256 _newStake) external onlyAdmin {
        creationStake = _newStake;
    }

    // Resolución: La IA usa esto
    function settleMarket(address _market, bool _outcome, uint8 _confidence) external onlyOracleOrAdmin {
        require(isMarket[_market], "Mercado invalido");
        IMarket(_market).settle(_outcome, _confidence);
    }

    // Intervención Humana (The Missing Link): Solo el Admin puede corregir a la IA
    function correctMarket(address _market, bool _newOutcome) external onlyAdmin {
        require(isMarket[_market], "Mercado invalido");
        IMarket(_market).emergencyCorrection(_newOutcome);
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit FactoryPaused(_paused);
    }
}
