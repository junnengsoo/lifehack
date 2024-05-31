// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ContentRegistry.sol";

/**
 * @title LicenseManager
 * @dev Manages the creation of license templates and the issuance of licenses for digital content.
 * Allows content owners to create license templates and users to obtain licenses automatically.
 */
contract LicenseManager {
    /**
     * @dev Represents a license issued for a specific content.
     */
    struct License {
        string contentHash;
        address licensee;
        uint256 startDate;
        uint256 endDate;
        bool commercialUse;
        bool modificationAllowed;
        bool exclusive;
        uint256 licenseFee;
        uint256 royalty;
        string attributionText;
    }

    /**
     * @dev Represents a license template created by the content owner.
     */
    struct LicenseTemplate {
        uint256 templateId;
        address owner;
        uint256 startDate;
        uint256 endDate;
        bool commercialUse;
        bool modificationAllowed;
        bool exclusive;
        uint256 licenseFee;
        uint256 royalty;
        string attributionText;
    }

    /**
     * @dev Maps content hashes to arrays of license templates.
     */
    mapping(string => LicenseTemplate[]) public licenseTemplates;

    /**
     * @dev Maps content hashes and user addresses to their respective licenses. This supports multiple licenses for the same content hash.
     */
    mapping(string => mapping(address => License[])) public licenses;

    /**
     * @dev Instance of the ContentRegistry contract to verify content ownership.
     */
    ContentRegistry contentRegistry;

    /**
     * @dev Emitted when a license template is created.
     */
    event LicenseTemplateCreated(
        string contentHash,
        uint256 templateId,
        address owner,
        uint256 startDate,
        uint256 endDate,
        bool commercialUse,
        bool modificationAllowed,
        bool exclusive,
        uint256 licenseFee,
        uint256 royalty,
        string attributionText
    );

    /**
     * @dev Emitted when a license is issued.
     */
    event LicenseIssued(
        string contentHash,
        address licensee,
        uint256 startDate,
        uint256 endDate,
        bool commercialUse,
        bool modificationAllowed,
        bool exclusive,
        uint256 licenseFee,
        uint256 royalty,
        string attributionText
    );

    /**
     * @dev Emitted when a royalty is paid.
     */
    event RoyaltyPaid(string contentHash, address licensee, uint256 amount);

    /**
     * @dev Initializes the contract by setting the address of the ContentRegistry contract.
     */
    constructor(address _contentRegistryAddress) {
        contentRegistry = ContentRegistry(_contentRegistryAddress);
    }

    /**
     * @dev Creates a license template for a specific content.
     */
    function createLicenseTemplate(
        string memory _contentHash,
        uint256 _startDate,
        uint256 _endDate,
        bool _commercialUse,
        bool _modificationAllowed,
        bool _exclusive,
        uint256 _licenseFee,
        uint256 _royalty,
        string memory _attributionText
    ) public {
        require(contentRegistry.getOwner(_contentHash) == msg.sender, "Only owner can create license template");
        require(_startDate < _endDate, "Invalid license period");

        uint256 templateId = licenseTemplates[_contentHash].length;

        licenseTemplates[_contentHash].push(LicenseTemplate({
            templateId: templateId,
            owner: msg.sender,
            startDate: _startDate,
            endDate: _endDate,
            commercialUse: _commercialUse,
            modificationAllowed: _modificationAllowed,
            exclusive: _exclusive,
            licenseFee: _licenseFee,
            royalty: _royalty,
            attributionText: _attributionText
        }));

        emit LicenseTemplateCreated(
            _contentHash,
            templateId,
            msg.sender,
            _startDate,
            _endDate,
            _commercialUse,
            _modificationAllowed,
            _exclusive,
            _licenseFee,
            _royalty,
            _attributionText
        );
    }

    /**
     * @dev Allows a user to obtain a license for a specific content by paying the license fee.
     */
    function obtainLicense(string memory _contentHash, uint256 templateId) public payable {
        require(templateId < licenseTemplates[_contentHash].length, "Invalid template ID");
        LicenseTemplate memory template = licenseTemplates[_contentHash][templateId];
        require(template.owner != address(0), "License template not found");
        require(msg.value >= template.licenseFee, "Insufficient license fee");

        licenses[_contentHash][msg.sender].push(License({
            contentHash: _contentHash,
            licensee: msg.sender,
            startDate: block.timestamp,
            endDate: template.endDate,
            commercialUse: template.commercialUse,
            modificationAllowed: template.modificationAllowed,
            exclusive: template.exclusive,
            licenseFee: template.licenseFee,
            royalty: template.royalty,
            attributionText: template.attributionText
        }));

        emit LicenseIssued(
            _contentHash,
            msg.sender,
            block.timestamp,
            template.endDate,
            template.commercialUse,
            template.modificationAllowed,
            template.exclusive,
            template.licenseFee,
            template.royalty,
            template.attributionText
        );

        payable(template.owner).transfer(msg.value);
    }

    /**
     * @dev Allows a licensee to pay the royalty fee for a specific content.
     */
    function payRoyalty(string memory _contentHash, uint256 licenseIndex) public payable {
        require(licenseIndex < licenses[_contentHash][msg.sender].length, "Invalid license index");
        License memory license = licenses[_contentHash][msg.sender][licenseIndex];
        require(license.licensee != address(0), "License not found");
        require(msg.value >= license.royalty, "Insufficient royalty payment");

        payable(contentRegistry.getOwner(_contentHash)).transfer(msg.value);
        emit RoyaltyPaid(_contentHash, msg.sender, msg.value);
    }

    /**
     * @dev Retrieves the license details for a specific content and user.
     */
    function getLicense(string memory _contentHash, address licensee, uint256 licenseIndex) public view returns (License memory) {
        require(licenseIndex < licenses[_contentHash][licensee].length, "Invalid license index");
        return licenses[_contentHash][licensee][licenseIndex];
    }

    /**
     * @dev Retrieves all licenses for a specific content and user.
     */
    function getAllLicenses(string memory _contentHash, address licensee) public view returns (License[] memory) {
        return licenses[_contentHash][licensee];
    }
}
