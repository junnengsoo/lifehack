// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ImageRegistry {
    struct Image {
        string fingerprint;
        string metadata;
        address owner;
    }

    mapping(string => Image) private images;

    function registerImage(string memory _fingerprint, string memory _metadata) public {
        require(bytes(images[_fingerprint].fingerprint).length == 0, "Image already registered");
        images[_fingerprint] = Image(_fingerprint, _metadata, msg.sender);
    }

    function getImage(string memory _fingerprint) public view returns (string memory, string memory, address) {
        require(bytes(images[_fingerprint].fingerprint).length != 0, "Image not found");
        Image memory img = images[_fingerprint];
        return (img.fingerprint, img.metadata, img.owner);
    }
}