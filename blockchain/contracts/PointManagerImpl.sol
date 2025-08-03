// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {MulticallUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {NoncesUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";

import {IPointManager} from "./interface/IPointManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {PointManagerStorage} from "./storage/PointManagerStorage.sol";

contract PointManagerImpl is
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    EIP712Upgradeable,
    MulticallUpgradeable,
    PausableUpgradeable,
    ERC165Upgradeable,
    UUPSUpgradeable,
    NoncesUpgradeable,
    IPointManager
{
    using SafeERC20 for IERC20;

    bytes32 public constant DEPOSIT_POINT_TYPEHASH =
        keccak256(
            "DepositPoint(address account,uint256 amount,uint256 validUntil,address manager,uint256 nonce)"
        );
    bytes32 public constant WITHDRAW_POINT_TYPEHASH =
        keccak256(
            "WithdrawPoint(address account,uint256 amount,uint256 validUntil,uint256 nonce)"
        );
    address private token_;

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _token,
        address _owner,
        uint256 _exchangeRate
    ) public initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __EIP712_init("PointManager", "1");
        __Multicall_init();
        __Pausable_init();
        __Nonces_init();
        __ERC165_init();

        token_ = _token;
        _pointManagerStorage().exchangeRate = _exchangeRate;
    }

    function grantManager(address account) external onlyOwner {
        require(
            account != address(0),
            "PointManager: account is the zero address"
        );
        require(
            !_pointManagerStorage().isPointManagerAccount[account],
            "PointManager: account already has manager role"
        );

        _pointManagerStorage().isPointManagerAccount[account] = true;

        emit ManagerGranted(account);
    }

    function revokeManager(address account) external onlyOwner {
        require(
            account != address(0),
            "PointManager: account is the zero address"
        );
        require(
            _pointManagerStorage().isPointManagerAccount[account],
            "PointManager: account does not have manager role"
        );

        _pointManagerStorage().isPointManagerAccount[account] = false;

        emit ManagerRevoked(account);
    }

    function setExchangeRate(uint256 exchangeRate) external onlyOwner {
        require(
            exchangeRate > 0,
            "PointManager: exchange rate must be greater than 0"
        );
        _pointManagerStorage().exchangeRate = exchangeRate;

        emit ExchangeRateUpdated(exchangeRate);
    }

    function setValidUser(address account, bool isValid) external onlyOwner {
        require(
            account != address(0),
            "PointManager: account is the zero address"
        );

        _pointManagerStorage().isValidUser[account] = isValid;

        emit ValidUserSet(account, isValid);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function depositPoint(
        address account,
        uint256 amount,
        uint256 validUntil,
        address manager,
        bytes memory signature
    ) public nonReentrant whenNotPaused {
        require(amount > 0, "PointManager: amount must be greater than 0");

        if (validUntil < block.timestamp) {
            revert ValidIsExpired();
        }

        if (!isValidUser(account)) {
            revert InvalidUser();
        }

        if (!isManager(manager)) {
            revert InvalidManager();
        }

        bytes32 structHash = keccak256(
            abi.encode(
                DEPOSIT_POINT_TYPEHASH,
                account,
                amount,
                validUntil,
                manager,
                _useNonce(manager)
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);

        // only manager's signature is needed
        if (!SignatureChecker.isValidSignatureNow(manager, hash, signature)) {
            revert InvalidSignature();
        }
        uint256 tokenAmount = (amount * 10 ** 18) /
            _pointManagerStorage().exchangeRate;

        IERC20(token_).safeTransfer(account, tokenAmount);

        emit PointDeposited(account, amount, tokenAmount);
    }

    function withdrawPoint(
        address account,
        uint256 amount,
        uint256 validUntil,
        bytes memory signature
    ) public nonReentrant whenNotPaused {
        require(amount > 0, "PointManager: amount must be greater than 0");

        if (validUntil < block.timestamp) {
            revert ValidIsExpired();
        }

        if (!isValidUser(account)) {
            revert InvalidUser();
        }

        bytes32 structHash = keccak256(
            abi.encode(
                WITHDRAW_POINT_TYPEHASH,
                account,
                amount,
                validUntil,
                _useNonce(account)
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);

        // only account's signature is needed
        if (!SignatureChecker.isValidSignatureNow(account, hash, signature)) {
            revert InvalidSignature();
        }

        uint256 tokenAmount = (amount * 10 ** 18) /
            _pointManagerStorage().exchangeRate;

        IERC20(token_).safeTransferFrom(account, address(this), tokenAmount);

        emit PointWithdrawn(account, amount, tokenAmount);
    }

    function isManager(address account) public view returns (bool) {
        return _pointManagerStorage().isPointManagerAccount[account];
    }

    function getExchangeRate() public view returns (uint256) {
        return _pointManagerStorage().exchangeRate;
    }

    function isValidUser(address account) public view returns (bool) {
        return _pointManagerStorage().isValidUser[account];
    }

    function getTokenAddress() public view returns (address) {
        return token_;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IPointManager).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    function _pointManagerStorage()
        internal
        pure
        returns (PointManagerStorage.Data storage data_)
    {
        data_ = PointManagerStorage.data();
    }
}
