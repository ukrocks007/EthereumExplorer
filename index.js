var express = require('express');
var app = express();
var fs = require("fs");
var Web3 = require("web3");

var provider = 'https://rinkeby.infura.io/v3/4a70b2f6e9f547f7ac9f086d489c2c95'; //Your Infura Endpoint
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
            web3.eth.getTransactionReceipt(req.params.TXID, function (err, receipt) {
                if (!err) {
                    //console.log(web3.eth.currentProvider);
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
                        "depositType": ""
                    };
                    web3.eth.getCode(info.from, function (err, code) {
                        console.log("Code:"+code);
                        txninfo.depositType = code!="0x" ? "contract" : "account";
                        res.send(txninfo);
                        res.end();
                    });
                    console.log(info.input);
                    console.log(receipt);
                    //console.log(info.da);
                }
            })
        });
})

var server = app.listen(8000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("Ethereum blockchain explorer listening at http://%s:%s", host, port)

})