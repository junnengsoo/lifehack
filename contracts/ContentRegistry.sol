// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContentRegistry {
    struct Content {
        string hash;
        address owner;
        uint256 timestamp;
    }

    mapping(string => Content) public contents;
    mapping(address => string[]) public creatorContents; // Maps creator address to their content hashes
    string[] public allContentHashes; // Stores all content hashes

    event ContentRegistered(string hash, address owner, uint256 timestamp);

    function registerContent(string memory _hash) public {
        require(bytes(_hash).length > 0, "Invalid content hash");
        require(contents[_hash].timestamp == 0, "Content already registered");

        contents[_hash] = Content(_hash, msg.sender, block.timestamp);
        creatorContents[msg.sender].push(_hash); // Add content hash to the creator's list
        allContentHashes.push(_hash); // Add content hash to the global list
        emit ContentRegistered(_hash, msg.sender, block.timestamp);
    }

    function getOwner(string memory _hash) public view returns (address) {
        return contents[_hash].owner;
    }

    function getTimestamp(string memory _hash) public view returns (uint256) {
        return contents[_hash].timestamp;
    }

    function getContentDetails(string memory _hash) public view returns (string memory, address, uint256) {
        Content memory content = contents[_hash];
        require(content.timestamp != 0, "Content not found"); // Ensure the content exists
        return (content.hash, content.owner, content.timestamp);
    }

    function getCreatorContents(address _creator) public view returns (string[] memory) {
        return creatorContents[_creator];
    }

    function getAllContents() public view returns (Content[] memory) {
        Content[] memory allContents = new Content[](allContentHashes.length);
        for (uint256 i = 0; i < allContentHashes.length; i++) {
            allContents[i] = contents[allContentHashes[i]];
        }
        return allContents;
    }
}
