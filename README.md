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

Run Ganache locally, check for host and port number and adjust `truffle-config.js` accordingly.

Running the Server `node server.js`



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
