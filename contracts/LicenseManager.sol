// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ContentRegistry.sol";

contract LicenseManager {
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

    mapping(string => LicenseTemplate[]) public licenseTemplates;
    mapping(string => mapping(address => License[])) public licenses;
    mapping(string => mapping(uint256 => License[])) public templateLicenses; // New: stores licenses for each template
    mapping(address => string[]) public userLicenses;

    ContentRegistry contentRegistry;

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

    event RoyaltyPaid(string contentHash, address licensee, uint256 amount);

    constructor(address _contentRegistryAddress) {
        contentRegistry = ContentRegistry(_contentRegistryAddress);
    }

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

    function obtainLicense(string memory _contentHash, uint256 templateId) public payable {
        require(templateId < licenseTemplates[_contentHash].length, "Invalid template ID");
        LicenseTemplate memory template = licenseTemplates[_contentHash][templateId];
        require(template.owner != address(0), "License template not found");
        require(msg.value >= template.licenseFee, "Insufficient license fee");

        License memory newLicense = License({
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
        });

        licenses[_contentHash][msg.sender].push(newLicense);
        templateLicenses[_contentHash][templateId].push(newLicense); // New: Add to template licenses
        userLicenses[msg.sender].push(_contentHash);

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

    function payRoyalty(string memory _contentHash, uint256 licenseIndex) public payable {
        require(licenseIndex < licenses[_contentHash][msg.sender].length, "Invalid license index");
        License memory license = licenses[_contentHash][msg.sender][licenseIndex];
        require(license.licensee != address(0), "License not found");
        require(msg.value >= license.royalty, "Insufficient royalty payment");

        payable(contentRegistry.getOwner(_contentHash)).transfer(msg.value);
        emit RoyaltyPaid(_contentHash, msg.sender, msg.value);
    }

    function getLicense(string memory _contentHash, address licensee, uint256 licenseIndex) public view returns (License memory) {
        require(licenseIndex < licenses[_contentHash][licensee].length, "Invalid license index");
        return licenses[_contentHash][licensee][licenseIndex];
    }

    function getAllLicenses(string memory _contentHash, address licensee) public view returns (License[] memory) {
        return licenses[_contentHash][licensee];
    }

    function getLicensesForContent(string memory _contentHash) public view returns (License[] memory) {
        uint256 totalLicenses;
        for (uint256 i = 0; i < licenseTemplates[_contentHash].length; i++) {
            totalLicenses += licenses[_contentHash][licenseTemplates[_contentHash][i].owner].length;
        }
        License[] memory allLicenses = new License[](totalLicenses);
        uint256 index;
        for (uint256 i = 0; i < licenseTemplates[_contentHash].length; i++) {
            address owner = licenseTemplates[_contentHash][i].owner;
            for (uint256 j = 0; j < licenses[_contentHash][owner].length; j++) {
                allLicenses[index++] = licenses[_contentHash][owner][j];
            }
        }
        return allLicenses;
    }

    function getUserLicenses(address userAddress) public view returns (License[] memory) {
        uint256 totalLicenses;
        for (uint256 i = 0; i < userLicenses[userAddress].length; i++) {
            totalLicenses += licenses[userLicenses[userAddress][i]][userAddress].length;
        }
        License[] memory allLicenses = new License[](totalLicenses);
        uint256 index;
        for (uint256 i = 0; i < userLicenses[userAddress].length; i++) {
            string memory contentHash = userLicenses[userAddress][i];
            for (uint256 j = 0; j < licenses[contentHash][userAddress].length; j++) {
                allLicenses[index++] = licenses[contentHash][userAddress][j];
            }
        }
        return allLicenses;
    }

    function getLicensesForTemplate(string memory _contentHash, uint256 templateId) public view returns (License[] memory) {
        return templateLicenses[_contentHash][templateId];
    }
}
