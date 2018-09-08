var express = require("express");
var app = express();
var Web3 = require("web3");
var request = require("request");
const InputDataDecoder = require("ethereum-input-data-decoder");

var provider = 'https://mainnet.infura.io/v3/4a70b2f6e9f547f7ac9f086d489c2c95'; //Your Infura Endpoint
var web3Provider = new Web3.providers.HttpProvider(provider);
var web3 = new Web3(web3Provider);

var networkName = "";

//Decodes the transaction input data
function decodeTxnInputData(ABI, Input) {
    const decoder = new InputDataDecoder(JSON.parse(ABI));
    const result = decoder.decodeData(Input);
    return result;
}

function sendAccountTransferTxnInfo(req, res, txnInfo, txnReceipt) {
    var txninfo = {
        "block": {
            "blockHeight": txnInfo.blockNumber,
        },

        "outs": [{
            "address": txnInfo.to,
            "value": txnInfo.value
        }],
        "ins": [{
            "address": txnInfo.from,
            "value": txnInfo.value * -1
        }],
        "hash": req.params.TXID,
        "currency": "ETH",
        "chain": "ETH." + networkName,
        "state": txnReceipt ? "Confirmed" : "Pending",
        "depositType": "account"
    };
    res.status(200);
    res.send(txninfo);
    res.end();
}

function sendERC20TransferTxnInfo(req, res, txnInfo, txnReceipt, inputData, quantity) {
    var txninfo = {
        "block": {
            "blockHeight": txnInfo.blockNumber,
        },

        "outs": [{
            "address": "0x" + inputData.inputs[0], //Receiver of the ERC20 token
            "value": quantity, //Quantity of ERC20 token
            "type": "token",
            "coinspecific": {
                "tokenAddress": txnInfo.to
            }

        }],
        "ins": [{
            "address": txnInfo.from,
            "value": "-" + quantity,
            "type": "token",
            "coinspecific": {
                "tokenAddress": txnInfo.to
            }
        }],
        "hash": req.params.TXID,
        "currency": "ETH",
        "chain": "ETH." + networkName,
        "state": txnReceipt ? "Confirmed" : "Pending",
        "depositType": "contract"
    };
    res.status(200);
    res.send(txninfo);
    res.end();
}

//Get ethereum network type
web3.eth.net.getNetworkType()
    .then(function (name) {
        networkName = name;
    })
    .catch(ex => {
        //console.log("Connection Problem!! Exiting...");
        process.exit();
    });

app.get('/', (req, res) => {
    res.status(200);
    res.send("Welcome to the Ethereum Explorer by Utkarsh Mehta");
    res.send();
});

app.get('/eth/api/v1/transaction/:TXID', (req, res) => {

    //console.log("TXid: " + req.params.TXID);

    //Fetches basic txn information
    web3.eth.getTransaction(req.params.TXID)
        .then(function (info, err) {
            if (info) {
                //Fetches txn receipt
                web3.eth.getTransactionReceipt(req.params.TXID, (err, receipt) => {
                    if (!err) {
                        //console.log(receipt);
                        //Fetches the code for the to address
                        web3.eth.getCode(info.to, (err, code) => {
                            //Checks if the address is account or contract
                            if (code != "0x") {
                                //Fetches the ABI for smart contract
                                request('http://api.etherscan.io/api?module=contract&action=getabi&address=' + info.to, (err, response, data) => {
                                    if (err) {
                                        res.status(404);
                                        res.send("Could not get contract source code");
                                        res.end();
                                    } else {
                                        var contractABI = "";
                                        try {
                                            contractABI = JSON.parse(data).result;
                                            //Etherscan api only returns ABI for verified contracts
                                            //We need the ABI to convert the input data of the txn.
                                            if (contractABI != '' && contractABI != "Contract source code not verified") {
                                                let result = decodeTxnInputData(contractABI, info.input);
                                                if (result) {
                                                    //ERC20 transfers
                                                    if (result.name == "transfer" && result.inputs) {
                                                        var value = ("" + result.inputs[1]);

                                                        sendERC20TransferTxnInfo(req, res, info, receipt, result, value);

                                                    } else {
                                                        //For smart contract invocation
                                                        var txninfo = {
                                                            "block": {
                                                                "blockHeight": info.blockNumber,
                                                            },

                                                            "outs": [{
                                                                "address": info.to,
                                                                "value": value,
                                                                "type": "transfer",
                                                                "coinspecific": {
                                                                    "tracehash": req.params.TXID
                                                                }

                                                            }],
                                                            "ins": [{
                                                                "address": info.to,
                                                                "value": value ? "-" + value : undefined,
                                                                "type": "transfer",
                                                                "coinspecific": {
                                                                    "tracehash": req.params.TXID
                                                                }
                                                            }],
                                                            "hash": req.params.TXID,
                                                            "currency": "ETH",
                                                            "chain": "ETH." + networkName,
                                                            "state": receipt ? "Confirmed" : "Pending",
                                                            "depositType": "contract"
                                                        };
                                                        res.send(txninfo);
                                                        res.end();
                                                    }
                                                }
                                            } else {
                                                var txninfo = {
                                                    "block": {
                                                        "blockHeight": info.blockNumber,
                                                    },

                                                    "outs": [{
                                                        "address": info.to,
                                                        "value": value,
                                                        "type": "transfer",
                                                        "coinspecific": {
                                                            "tracehash": req.params.TXID
                                                        }

                                                    }],
                                                    "ins": [{
                                                        "address": info.to,
                                                        "value": value ? "-" + value : undefined,
                                                        "type": "transfer",
                                                        "coinspecific": {
                                                            "tracehash": req.params.TXID
                                                        }
                                                    }],
                                                    "hash": req.params.TXID,
                                                    "currency": "ETH",
                                                    "chain": "ETH." + networkName,
                                                    "state": receipt ? "Confirmed" : "Pending",
                                                    "depositType": "contract"
                                                };
                                                res.send(txninfo);
                                                res.end();
                                            }
                                        } catch (ex) {
                                            res.status(404);
                                            res.send("Error occurred while get contract data");
                                            res.end();
                                        }
                                    }
                                });
                            } else {
                                //Account to account ETH transfers

                                sendAccountTransferTxnInfo(req, res, info, receipt);
                            }
                        });
                    } else {
                        res.status(404);
                        res.send("Error occoured while getting transaction receipt");
                        res.end();
                    }
                });
            } else {
                res.status(404);
                res.send("Error occoured while getting transaction information");
                res.end();
            }
        })
        .catch((ex) => {
            res.status(404);
            res.send("Error occoured while getting transaction information");
            res.end();
        });
})

app.all('*', (req, res) => {
    res.status(500);
    res.send('Invalid endpoint');
    res.end();
});

var server = app.listen(process.env.PORT || 8000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("Ethereum blockchain explorer listening at http://%s:%s", host, port)

})
module.exports = app;