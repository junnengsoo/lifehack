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
     * @param contentHash The hash of the content.
     * @param licensee The address of the licensee.
     * @param startDate The start date of the license in Unix timestamp.
     * @param endDate The end date of the license in Unix timestamp.
     * @param commercialUse Boolean indicating if commercial use is allowed.
     * @param modificationAllowed Boolean indicating if modifications are allowed.
     * @param exclusive Boolean indicating if the license is exclusive.
     * @param licenseFee The fee for the license in Wei.
     * @param royalty The royalty fee in Wei.
     * @param attributionText The text to be used for attribution.
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
     * @param owner The address of the content owner.
     * @param startDate The start date of the license in Unix timestamp.
     * @param endDate The end date of the license in Unix timestamp.
     * @param commercialUse Boolean indicating if commercial use is allowed.
     * @param modificationAllowed Boolean indicating if modifications are allowed.
     * @param exclusive Boolean indicating if the license is exclusive.
     * @param licenseFee The fee for the license in Wei.
     * @param royalty The royalty fee in Wei.
     * @param attributionText The text to be used for attribution.
     */
    struct LicenseTemplate {
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
     * @dev Maps content hashes to their respective license templates.
     */
    mapping(string => LicenseTemplate) public licenseTemplates;

    /**
     * @dev Maps content hashes to their respective licenses.
     */
    mapping(string => License) public licenses;

    /**
     * @dev Instance of the ContentRegistry contract to verify content ownership.
     */
    ContentRegistry contentRegistry;

    /**
     * @dev Emitted when a license template is created.
     * @param contentHash The hash of the content.
     * @param owner The address of the content owner.
     * @param startDate The start date of the license in Unix timestamp.
     * @param endDate The end date of the license in Unix timestamp.
     * @param commercialUse Boolean indicating if commercial use is allowed.
     * @param modificationAllowed Boolean indicating if modifications are allowed.
     * @param exclusive Boolean indicating if the license is exclusive.
     * @param licenseFee The fee for the license in Wei.
     * @param royalty The royalty fee in Wei.
     * @param attributionText The text to be used for attribution.
     */
    event LicenseTemplateCreated(
        string contentHash,
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
     * @param contentHash The hash of the content.
     * @param licensee The address of the licensee.
     * @param startDate The start date of the license in Unix timestamp.
     * @param endDate The end date of the license in Unix timestamp.
     * @param commercialUse Boolean indicating if commercial use is allowed.
     * @param modificationAllowed Boolean indicating if modifications are allowed.
     * @param exclusive Boolean indicating if the license is exclusive.
     * @param licenseFee The fee for the license in Wei.
     * @param royalty The royalty fee in Wei.
     * @param attributionText The text to be used for attribution.
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
     * @param contentHash The hash of the content.
     * @param licensee The address of the licensee.
     * @param amount The amount of royalty paid in Wei.
     */
    event RoyaltyPaid(string contentHash, address licensee, uint256 amount);

    /**
     * @dev Initializes the contract by setting the address of the ContentRegistry contract.
     * @param _contentRegistryAddress The address of the ContentRegistry contract.
     */
    constructor(address _contentRegistryAddress) {
        contentRegistry = ContentRegistry(_contentRegistryAddress);
    }

    /**
     * @dev Creates a license template for a specific content.
     * @param _contentHash The hash of the content.
     * @param _startDate The start date of the license in Unix timestamp.
     * @param _endDate The end date of the license in Unix timestamp.
     * @param _commercialUse Boolean indicating if commercial use is allowed.
     * @param _modificationAllowed Boolean indicating if modifications are allowed.
     * @param _exclusive Boolean indicating if the license is exclusive.
     * @param _licenseFee The fee for the license in Wei.
     * @param _royalty The royalty fee in Wei.
     * @param _attributionText The text to be used for attribution.
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

        licenseTemplates[_contentHash] = LicenseTemplate({
            owner: msg.sender,
            startDate: _startDate,
            endDate: _endDate,
            commercialUse: _commercialUse,
            modificationAllowed: _modificationAllowed,
            exclusive: _exclusive,
            licenseFee: _licenseFee,
            royalty: _royalty,
            attributionText: _attributionText
        });

        emit LicenseTemplateCreated(
            _contentHash,
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
     * @param _contentHash The hash of the content to obtain the license for.
     */
    function obtainLicense(string memory _contentHash) public payable {
        LicenseTemplate memory template = licenseTemplates[_contentHash];
        require(template.owner != address(0), "License template not found");
        require(msg.value >= template.licenseFee, "Insufficient license fee");

        licenses[_contentHash] = License({
            contentHash: _contentHash,
            licensee: msg.sender,
            startDate: template.startDate,
            endDate: template.endDate,
            commercialUse: template.commercialUse,
            modificationAllowed: template.modificationAllowed,
            exclusive: template.exclusive,
            licenseFee: template.licenseFee,
            royalty: template.royalty,
            attributionText: template.attributionText
        });

        emit LicenseIssued(
            _contentHash,
            msg.sender,
            template.startDate,
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
     * @param _contentHash The hash of the content for which the royalty is being paid.
     */
    function payRoyalty(string memory _contentHash) public payable {
        License memory license = licenses[_contentHash];
        require(license.licensee != address(0), "License not found");
        require(msg.value >= license.royalty, "Insufficient royalty payment");

        payable(contentRegistry.getOwner(_contentHash)).transfer(msg.value);
        emit RoyaltyPaid(_contentHash, msg.sender, msg.value);
    }

    /**
     * @dev Retrieves the license details for a specific content.
     * @param _contentHash The hash of the content.
     * @return The license details.
     */
    function getLicense(string memory _contentHash) public view returns (License memory) {
        return licenses[_contentHash];
    }
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes
