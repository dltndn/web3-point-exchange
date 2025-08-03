// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library PointManagerStorage {
    // keccak256(abi.encode(uint256(keccak256("pointManager.storage.BloomProject")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 constant POINT_MANAGER_STORAGE_LOCATION = 0x286a1d5452a4ea2bbf85c1351e64889ecf2efdecc0be17c9b5be75095d2d2f00;

    struct Data {
        uint256 exchangeRate; // 100 point = 1 token, 100
        mapping(address => bool) isPointManagerAccount;
        mapping(address => bool) isValidUser;
    }

    function data() internal pure returns (Data storage data_) {
        bytes32 location = POINT_MANAGER_STORAGE_LOCATION;
        assembly {
            data_.slot := location
        }
    }
}
