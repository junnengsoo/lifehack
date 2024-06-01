### Prerequisites
Ensure you have the following installed:
- Node.js
- npm
- Truffle
- Ganache (Download the GUI version from Google)

on Ganache:

Click New Workspace (Ethereum)

Add Project 

Locate truffle-config.json from Lifehack root directory

Click Start



Clone the Repository:
`git clone [https://github.com/yourusername/blockchain-image-protection.git](https://github.com/junnengsoo/lifehack.git)`

Navigate to the Project Directory:
`cd lifehack`

Install Dependencies:
`npm install`

Compile Contracts:
`truffle compile`

Run Migrations:
`truffle migrate --reset`

```bash
Compiling your contracts...
===========================
> Compiling ./contracts/ContentRegistry.sol
> Compiling ./contracts/LicenseManager.sol
> Artifacts written to /Users/jerielchan/Documents/lifehack/build/contracts
> Compiled successfully using:
   - solc: 0.8.0+commit.c7dfd78e.Emscripten.clang

Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.


Starting migrations...
======================
> Network name:    'development'
> Network id:      5777
> Block gas limit: 6721975 (0x6691b7)


2_deploy_contracts.js
=====================

   Replacing 'ContentRegistry'
   ---------------------------
   > transaction hash:    0x9ec0e779334e542745c59ce6d2bf3cbb62dfd2554c4804f4eb46a16ea1ef5644
   > Blocks: 0            Seconds: 0
   > contract address:    0x91563e319f5b40a9D072e761d5A186243576E139
   > block number:        1
   > block timestamp:     1717210116
   > account:             0xB0232A2A760Aa07fa73A70dC7967e69bd3b2d87a
   > balance:             99.99564718825
   > gas used:            1289722 (0x13adfa)
   > gas price:           3.375 gwei
   > value sent:          0 ETH
   > total cost:          0.00435281175 ETH


   Replacing 'LicenseManager'
   --------------------------
   > transaction hash:    0xc02f052c668e189d774a5fa48684ddb11b5d463b2ceb47b819ee9f3e49dcb842
   > Blocks: 0            Seconds: 0
   > contract address:    0x829b935F3bfE971f8C4a7Ca471acad532e0fa7da
   > block number:        2
   > block timestamp:     1717210117
   > account:             0xB0232A2A760Aa07fa73A70dC7967e69bd3b2d87a
   > balance:             99.98354561469284518
   > gas used:            3658722 (0x37d3e2)
   > gas price:           3.30759581 gwei
   > value sent:          0 ETH
   > total cost:          0.01210157355715482 ETH

   > Saving artifacts
   -------------------------------------
   > Total cost:     0.01645438530715482 ETH

Summary
=======
> Total deployments:   2
> Final cost:          0.01645438530715482 ETH



# API Calls

## 1. Health Check Endpoint
Method: GET
Endpoint: /health
Description: Checks if the backend server is working.
Request Body: None
Response:
200 OK:
json `{ "message": "Backend is working" }`

## 2. Register Content
Method: POST
Endpoint: /register
Description: Registers the content on the blockchain by uploading an image, generating a hash, and storing it.
Request Body:
Form-data:
image: The image file to be uploaded.
Response:
200 OK:
json `{ "message": "Content registered successfully", "hash": "contentHash" }`
500 Internal Server Error:
json `{ "error": "error message" }`

## 3. Get Content Details
Method: POST
Endpoint: /content-details
Description: Retrieves the details of the content from the blockchain based on the image hash.
Request Body:
Form-data:
image: The image file to be uploaded.
Response:
200 OK (Content found):
json `{ "message": "Content found", "hash": "contentHash", "owner": "ownerAddress", "timestamp": "timestamp" }`
404 Not Found (Content not found): 
json `{ "message": "No content found for the given hash", "hash": "contentHash" }`
500 Internal Server Error:
json `{ "error": "error message" }`

## 4. Create One or More License Templates
Method: POST
Endpoint: /create-license-templates
Description: Creates one or more license templates for a single digital asset.
Request Body:
JSON:
"""
{
  "contentHash": "contentHash",
  "templates": [
    {
      "startDate": "startDate",
      "endDate": "endDate",
      "commercialUse": true,
      "modificationAllowed": true,
      "exclusive": false,
      "licenseFee": "licenseFee",
      "royalty": "royalty",
      "attributionText": "attributionText"
    }
    // More templates can be added here
  ]
}
"""
Response:
200 OK:
json `{ "message": "License templates created successfully" }`
500 Internal Server Error:
json `{ "error": "error message" }`

## 5. Obtain One or More Licenses
Method: POST
Endpoint: /obtain-licenses
Description: Obtains one or more licenses for a single digital asset.
Request Body:
JSON:
"""
{
  "contentHash": "contentHash",
  "templateIds": ["templateId1", "templateId2", ...]
}
"""
Response:
200 OK:
json `{ "message": "Licenses obtained successfully" }`
500 Internal Server Error:
json `{ "error": "error message" }`

## 6. Pay Royalty to a Single License
Method: POST
Endpoint: /pay-royalty
Description: Pays royalty to a specific license.
Request Body:
JSON:
"""
{
  "contentHash": "contentHash",
  "licenseIndex": "licenseIndex",
  "amount": "amount"
}
"""
Response:
200 OK:
json `{ "message": "Royalty paid successfully" }`
500 Internal Server Error:
json `{ "error": "error message" }`
