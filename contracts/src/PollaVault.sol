// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title PollaVault
 * @dev Contrato para el sistema Pari-Mutuel (Polla Futbolera) de PredicFi.
 * Soporta hasta 15 participantes con liquidación off-chain optimizada.
 */
contract PollaVault is Initializable {
    // 1. Constantes y Parámetros
    uint256 public constant MAX_PARTICIPANTS = 15;
    uint256 public constant FEE_BPS = 100; // 1%
    uint256 public constant ADMIN_SHARE_BPS = 7000; // 70% de la comisión
    uint256 public constant CREATOR_SHARE_BPS = 3000; // 30% de la comisión
    uint256 public constant DISPUTE_PERIOD = 24 hours;

    address public usdc;
    address public admin;
    address public creator;
    uint256 public entryCost;
    
    address[] public participants;
    bool public resolved;
    uint256 public totalPool;

    // Estado de Resolución con Timelock
    uint256 public resolutionTime;
    address[] public pendingWinners;
    uint256[] public pendingPayouts;
    bool public payoutsExecuted;

    // 2. Eventos
    event ParticipantJoined(address indexed participant);
    event VaultResolved(uint256 totalPool, uint256 feeCollected, uint256 resolvedAt);
    event PayoutDistributed(address indexed winner, uint256 amount);
    event ResolutionCorrected(address[] newWinners, uint256[] newPayouts);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // 3. Inicialización
    function initialize(
        address _usdc,
        address _admin,
        address _creator,
        uint256 _entryCost
    ) external initializer {
        usdc = _usdc;
        admin = _admin;
        creator = _creator;
        entryCost = _entryCost;
    }

    // 4. Funciones de Usuario
    
    function joinTournament() public {
        require(!resolved, "Torneo ya resuelto");
        require(participants.length < MAX_PARTICIPANTS, "Cupo completo");
        require(IERC20(usdc).transferFrom(msg.sender, address(this), entryCost), "Fallo transferencia USDC");

        participants.push(msg.sender);
        totalPool += entryCost;

        emit ParticipantJoined(msg.sender);
    }

    /**
     * @dev Permite unirse usando el flujo Permit (EIP-2612) para ahorrar gas al usuario.
     */
    function joinTournamentWithPermit(
        uint256 _deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        IERC20(usdc).permit(msg.sender, address(this), entryCost, _deadline, v, r, s);
        joinTournament();
    }

    // 5. Resolución y Timelock (Solo Admin/Oracle)
    /**
     * @dev Propone la resolución del torneo e inicia el periodo de disputa de 24h.
     * @param winners Lista de direcciones ganadoras.
     * @param payouts Montos exactos a pagar a cada ganador.
     */
    function resolveTournament(
        address[] calldata winners,
        uint256[] calldata payouts
    ) external {
        require(msg.sender == admin, "Solo Admin");
        require(!resolved, "Ya resuelto");
        require(winners.length == payouts.length, "Arrays desbalanceados");

        resolved = true;
        resolutionTime = block.timestamp;
        pendingWinners = winners;
        pendingPayouts = payouts;

        uint256 totalFee = (totalPool * FEE_BPS) / 10000;
        emit VaultResolved(totalPool, totalFee, resolutionTime);
    }

    /**
     * @dev Permite corregir la resolución durante el periodo de disputa.
     */
    function emergencyCorrection(
        address[] calldata newWinners,
        uint256[] calldata newPayouts
    ) external {
        require(msg.sender == admin, "Solo Admin");
        require(resolved, "No resuelto aun");
        require(!payoutsExecuted, "Premios ya pagados");
        require(block.timestamp <= resolutionTime + DISPUTE_PERIOD, "Periodo de disputa cerrado");
        require(newWinners.length == newPayouts.length, "Arrays desbalanceados");

        pendingWinners = newWinners;
        pendingPayouts = newPayouts;

        emit ResolutionCorrected(newWinners, newPayouts);
    }

    modifier afterTimelock() {
        require(block.timestamp >= resolutionTime + DISPUTE_PERIOD, "Fondos bloqueados por timelock de 24h");
        _;
    }

    /**
     * @dev Distribuye los premios una vez pasado el periodo de disputa.
     */
    function executePayout() external afterTimelock {
        require(resolved, "No resuelto");
        require(!payoutsExecuted, "Ya ejecutado");

        payoutsExecuted = true;

        // Cálculo y distribución de comisiones (1%)
        uint256 totalFee = (totalPool * FEE_BPS) / 10000;
        uint256 adminFee = (totalFee * ADMIN_SHARE_BPS) / 10000;
        uint256 creatorFee = totalFee - adminFee;

        if (totalFee > 0) {
            require(IERC20(usdc).transfer(admin, adminFee), "Fallo pago admin fee");
            require(IERC20(usdc).transfer(creator, creatorFee), "Fallo pago creator fee");
        }

        // Distribución de premios
        uint256 totalDistributed = 0;
        for (uint256 i = 0; i < pendingWinners.length; i++) {
            require(IERC20(usdc).transfer(pendingWinners[i], pendingPayouts[i]), "Fallo pago ganador");
            totalDistributed += pendingPayouts[i];
            emit PayoutDistributed(pendingWinners[i], pendingPayouts[i]);
        }

        require(totalFee + totalDistributed <= totalPool, "Excede pozo total");
    }

    // 6. Funciones de Vista
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    function participantsCount() external view returns (uint256) {
        return participants.length;
    }
}
