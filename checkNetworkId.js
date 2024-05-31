const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:7545');

web3.eth.net.getId().then(console.log);
