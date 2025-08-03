// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPointManager {
    event ManagerGranted(address indexed account);
    event ManagerRevoked(address indexed account);
    event ExchangeRateUpdated(uint256 exchangeRate);
    event PointDeposited(address indexed account, uint256 amount, uint256 tokenAmount);
    event PointWithdrawn(address indexed account, uint256 amount, uint256 tokenAmount);
    event ValidUserSet(address indexed account, bool isValid);

    error InvalidSignature();
    error InvalidUser();
    error InvalidManager();
    error ValidIsExpired();

    /**
     * @notice Grant manager role to an account
     * @param account The account to grant manager role to
     */
    function grantManager(address account) external;

    /**
     * @notice Revoke manager role from an account
     * @param account The account to revoke manager role from
     */
    function revokeManager(address account) external;

    /**
     * @notice Check if an account has manager role
     * @param account The account to check
     * @return bool True if the account has manager role, false otherwise
     */
    function isManager(address account) external view returns (bool);

    /**
     * @notice Get the exchange rate
     * @return uint256 The exchange rate
     */
    function getExchangeRate() external view returns (uint256);

    /**
     * @notice Set the exchange rate
     * @param exchangeRate The exchange rate to set
     */
    function setExchangeRate(uint256 exchangeRate) external;

    /**
     * @notice Set the valid user
     * @param account The account to set
     * @param isValid True if the account is valid, false otherwise
     */
    function setValidUser(address account, bool isValid) external;

    /**
     * @notice Check if an account is valid
     * @param account The account to check
     * @return bool True if the account is valid, false otherwise
     */
    function isValidUser(address account) external view returns (bool);

    /**
     * @notice Get the token address
     * @return address The token address
     */
    function getTokenAddress() external view returns (address);

    /**
     * @notice Deposit point to an account
     * @dev The manager is the account that will sign the transaction
     * @param account The account to deposit point to
     * @param amount The amount of point to deposit
     * @param validUntil The valid until timestamp
     * @param manager The manager of the account
     * @param signature The signature of the account
     */
    function depositPoint(address account, uint256 amount, uint256 validUntil, address manager, bytes memory signature) external;

    /**
     * @notice Withdraw point from an account
     * @param account The account to withdraw point from
     * @param amount The amount of point to withdraw
     * @param validUntil The valid until timestamp
     * @param signature The signature of the account
     */
    function withdrawPoint(address account, uint256 amount, uint256 validUntil, bytes memory signature) external;
}
