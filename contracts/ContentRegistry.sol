// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContentRegistry {
    struct Content {
        string hash;
        address owner;
        uint256 timestamp;
    }

    mapping(string => Content) public contents;

    event ContentRegistered(string hash, address owner, uint256 timestamp);

    function registerContent(string memory _hash) public {
        require(bytes(_hash).length > 0, "Invalid content hash");
        require(contents[_hash].timestamp == 0, "Content already registered");

        contents[_hash] = Content(_hash, msg.sender, block.timestamp);
        emit ContentRegistered(_hash, msg.sender, block.timestamp);
    }

    function getOwner(string memory _hash) public view returns (address) {
        return contents[_hash].owner;
    }

    function getTimestamp(string memory _hash) public view returns (uint256) {
        return contents[_hash].timestamp;
    }
}
