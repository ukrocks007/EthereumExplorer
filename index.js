var express = require('express');
var app = express();
var fs = require("fs");
var Web3 = require("web3");
var request = require('request');
const InputDataDecoder = require('ethereum-input-data-decoder');

var provider = 'https://mainnet.infura.io/v3/4a70b2f6e9f547f7ac9f086d489c2c95'; //Your Infura Endpoint
var web3Provider = new Web3.providers.HttpProvider(provider);
var web3 = new Web3(web3Provider);

var networkName = "";
web3.eth.net.getNetworkType()
    .then(function (name) {
        networkName = name;
    });

app.get('/eth/api/v1/transaction/:TXID', function (req, res) {
    console.log(req.params.TXID);
    web3.eth.getTransaction(req.params.TXID)
        .then(function (info, err) {
            if (info) {
                web3.eth.getTransactionReceipt(req.params.TXID, function (err, receipt) {
                    if (!err) {
                        web3.eth.getCode(info.to, function (err, code) {
                            if (code != "0x") {
                                request('http://api.etherscan.io/api?module=contract&action=getabi&address=' + info.to, function (err, response, data) {
                                    //console.log(data);
                                    var contractABI = "";
                                    contractABI = JSON.parse(data);
                                    if (contractABI.result != '') {
                                        const decoder = new InputDataDecoder(JSON.parse(contractABI.result));
                                        const result = decoder.decodeData(info.input);
                                        console.log(result);
                                        if (result) {
                                            if (result.name == "transfer" && result.inputs) {
                                                console.log(result.inputs[1]);
                                                var value = ("" + result.inputs[1]);
                                                console.log(value);

                                                var txninfo = {
                                                    "block": {
                                                        "blockHeight": info.blockNumber,
                                                    },

                                                    "outs": [{
                                                        "address": "0x"+result.inputs[0],
                                                        "value": value,
                                                        "type": "token",
                                                        "coinspecific": {
                                                            "tokenAddress": info.to
                                                        }

                                                    }],
                                                    "ins": [{
                                                        "address": info.from,
                                                        "value": value * -1,
                                                        "type": "token",
                                                        "coinspecific": {
                                                            "tokenAddress": info.to
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
                                        console.log("Error");
                                    }
                                });
                            } else {
                                var txninfo = {
                                    "block": {
                                        "blockHeight": info.blockNumber,
                                    },

                                    "outs": [{
                                        "address": info.to,
                                        "value": info.value
                                    }],
                                    "ins": [{
                                        "address": info.from,
                                        "value": info.value * -1
                                    }],
                                    "hash": req.params.TXID,
                                    "currency": "ETH",
                                    "chain": "ETH." + networkName,
                                    "state": receipt ? "Confirmed" : "Pending",
                                    "depositType": "account"
                                };
                                res.send(txninfo);
                                res.end();
                            }
                        });

                        // console.log(info);
                        // console.log(receipt);
                        //console.log(info.da);
                    }
                });
            }
        });
})

var server = app.listen(8000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("Ethereum blockchain explorer listening at http://%s:%s", host, port)

})