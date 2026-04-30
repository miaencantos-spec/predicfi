// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMarket {
    function initialize(
        string memory _question, 
        uint256 _endTime, 
        address _creator, 
        address _usdc
    ) external;

    function buyShares(bool _outcome, uint256 _amount) external;
    
    function settle(bool _outcome, uint8 _confidence) external;

    function emergencyCorrection(bool _newOutcome) external;

    function claim() external;

    function resolved() external view returns (bool);
}
