'use strict';

var StellarSdk = require('stellar-sdk');
const stellar = require('../stellar-js-utils');
var axios = require('axios');
require('dotenv').load();
const logger = require('./logger.js');

class StellarUtil {

    constructor() {
        this.horizon = this._createHorizonServer(process.env.STELLAR_NETWORK);
        this.server = this.horizon.server();
        this.serverAPI = new stellar.StellarAPI(this.horizon);
        this.xlmAsset = new StellarSdk.Asset.native();
		this.unskAsset = new StellarSdk.Asset(process.env.UNSK_CODE, process.env.ISSUER_PUBLIC);
    }

    _createHorizonServer(network) {
        let result

        switch (network) {
            case 'testnet':
                result = new stellar.HorizonServer('https://horizon-testnet.stellar.org', true);
                StellarSdk.Network.useTestNetwork();
                break
            case 'mainnet':
                result = new stellar.HorizonServer('https://horizon.stellar.org', false);
                StellarSdk.Network.usePublicNetwork();
                break
            default:
                console.log('ERROR: switch failed')
                break
        }
        return result
    }
    
    buildTx(secretkey, destination, amount, asset) {
        let sourceWallet = stellar.StellarWallet.secret(secretkey);

       return sourceWallet.publicKey()
        .then((publicKey) => { 
            return this.server.loadAccount(publicKey)
        }).then((account) => {
            const options = {
              destination: destination,
              asset: asset == "XLM" ? this.xlmAsset : this.unskAsset,
              amount: amount
            };

            const transaction = new StellarSdk.TransactionBuilder(account)
              .addOperation(StellarSdk.Operation.payment(options))
              .addMemo(StellarSdk.Memo.text('HODL Locked account'))
              .build();

              var sourceKeys = StellarSdk.Keypair.fromSecret(secretkey);

              transaction.sign(sourceKeys);
              let tx = transaction.toEnvelope().toXDR().toString("base64");
              console.log(tx);
              return tx;
          });
    }
    
    sendAsset(sourcekey, destination, amount, asset, memo) {
        var asset = (asset == 'XLM') ? this.xlmAsset : this.unskTokenAsset();

        return this.serverAPI.sendAsset(stellar.StellarWallet.secret(sourcekey), null, destination, amount, asset, memo);
    }

    transactions(account, cursor = null) {
        logger.info('Start Transactions .....');
        return this.serverAPI.server().payments().limit(200).order('desc').cursor(cursor).forAccount(account).call();
    }
    
    verifyAccount(secretkey) {
        try {
            StellarSdk.Keypair.fromSecret(secretkey);
            return true;
        } catch(err) {
            return false;
        }
    }

    getPublicKey(secretkey) {
        try {
            var sourceKeys = StellarSdk.Keypair.fromSecret(secretkey);
            return sourceKeys.publicKey();
        } catch(err) {
            return false;
        }
    }

    unskTokenAsset() {
        return new StellarSdk.Asset(process.env.UNSK_CODE, process.env.ISSUER_PUBLIC);
    }

    fundAccount(key) {
        const url = 'https://horizon-testnet.stellar.org/friendbot' + '?addr=' + key;
        return axios.get(url);
    }

    fundTestAccount(key) {
        //1- Fund test account
        //2- Change Trust
        //3- Allow Trust
        return this.createAccount(process.env.FUNDTESTACCOUNT, key, '200');
    }

    friendBotServer() {
        if (!this._friendBotServer) {
            this._friendBotServer = this._createHorizonServer('testnet')
        }

        return this._friendBotServer.server()
    }

    createNewAccount() {
        logger.info('Start createNewAccount function');
        var pair = StellarSdk.Keypair.random();
        var private_key = pair.secret();
        var public_key = pair.publicKey();

        var account = {
            public_key: public_key,
            private_key: private_key
        };
        
        if (process.env.STELLAR_NETWORK == 'testnet') {
            logger.info('Start Funding Account');
            this.fundTestAccount(public_key).then((acc) => {
                logger.info('Account has been funded, ' + public_key);

                this.changeTrust(private_key, this.unskTokenAsset(), '922337203685.4775807').then((res) => {
                    logger.info('Change Trust');
 
                }).catch(function (err) {
                    logger.debug('Change Trust Error');
                    logger.debug(err);
                });
            }).catch((err) => {
                logger.debug('Fund Account Error');
                logger.debug(err);
            });
        }        
        return account;
    }

    generateNewAccount(fundaccount = false) {
        logger.info('Start generateNewAccount function');
        var pair = StellarSdk.Keypair.random();
        var private_key = pair.secret();
        var public_key = pair.publicKey();

        var account = {
            public_key: public_key,
            private_key: private_key
        };
        
        if (fundaccount == true) {
            logger.info('Start Funding Generated Account');
            this.createAccount(process.env.FUNDTESTACCOUNT, public_key, '200').then((res) => {
                logger.info('Change Trust account');
                this.changeTrust(private_key, this.unskTokenAsset(), '922337203685.4775807').then((res) => {
                    logger.info('Change Trust');
                }).catch(function (err) {
                    logger.debug('Change Trust Error');
                    logger.debug(err);
                });
            });
        }
        
        return account;
    }

    async createHODLAccount() {
        logger.info('Start createHODLAccount function');
        var pair = StellarSdk.Keypair.random();
        var private_key = pair.secret();
        var public_key = pair.publicKey();

        var account = {
            public_key: public_key,
            private_key: private_key
        };

        try {
            await this.createAccount(process.env.FUNDTESTACCOUNT, public_key, '2.5');    
        } catch (error) {
            console.log(error);
            return error;
        }
        
        try {
            await this.changeTrust(private_key, this.unskTokenAsset(), '922337203685.4775807');
        } catch (error) {
            console.log(error);
        }     
        
        return account;
    }

    balances(publicKey) {
        return this.serverAPI.balances(publicKey);
    }

    accountInfo(publicKey) {
        return this.serverAPI.accountInfo(publicKey)
    }

    changeTrust(sourcekey, asset, amount) {
        return this.serverAPI.changeTrust(stellar.StellarWallet.secret(sourcekey), asset, amount);
    }

   
    submitTransaction(transaction) {
        return this.serverAPI.submitTransaction(transaction)
    }    

    createAccount(sourceSecretKey, destinationKey, startingBalance) {
        logger.info('Start Creating Account .....');
        return this.serverAPI.createAccount(stellar.StellarWallet.secret(sourceSecretKey), destinationKey, startingBalance)
    }
  
    createTestAccount() {
        const keyPair = StellarSdk.Keypair.random();
        const url = 'https://horizon-testnet.stellar.org/friendbot' + '?addr=' + keyPair.publicKey();

        return axios.get(url)
            .then((info) => {
                return keyPair;
            })
            .catch((error) => {});
    }

    getFederationAddress(address) {
       return StellarSdk.FederationServer.resolve(address);
    }

    isFederation(fedString) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))\*((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (re.test(String(fedString).toLowerCase())) {
            return true;
        }
        return false;
    }
	
	exchangeXLMtoUNSK(sourcekey, amount, price) {
        var buying = this.unskAsset;
        var selling = this.xlmAsset;

        return this.serverAPI.manageOffer(stellar.StellarWallet.secret(sourcekey), null, buying, selling, amount, price);
    }

    exchangeUNSKtoXLM(sourcekey, amount, price) {
        var buying = this.xlmAsset;
        var selling = this.unskAsset;

        return this.serverAPI.manageOffer(stellar.StellarWallet.secret(sourcekey), null, buying, selling , amount, price);
    }

    manageOffer(sourcekey, buying, selling, amount, price, offerID = 0) {
        var buying = (buying == 'XLM') ? this.xlmAsset : this.unskAsset;
        var selling = (selling == 'XLM') ? this.xlmAsset : this.unskAsset;

        
        return this.serverAPI.manageOffer(stellar.StellarWallet.secret(sourcekey), null, buying, selling, amount, price, offerID);
    }

    account_offers(account) {
        logger.info('Get account offers .....');
        return this.serverAPI.server().offers('accounts', account).order('desc').call();
    }

    offers() {
        logger.info('Get offers .....');
        return this.serverAPI.server().orderbook(this.xlmAsset, this.unskAsset).call();
    }

    errors(msg) {
        let messages = {
            'tx_failed': 'Transaction failed',
            'tx_too_early': 'Its too early to execute the transcation',
            'tx_too_late': 'Its too late to execute the transcation',
            'tx_bad_seq': 'Bad Seq',
            'tx_insufficient_fee': 'Insufficient fees',
            'tx_internal_error': 'Internal error',
            'op_bad_auth': 'Bad Auth',
            'op_no_trust': 'No trust between Destination and Asset',
            'op_no_destination': 'Destination account is not exist',
            'op_underfunded': 'The operation failed due to a lack of funds.',
            'op_low_reserve': 'the operation failed because the account in question does not have enough balance'
        }
        return messages[msg];
    }

    getError(error) {
        try {
            var title = error.response.data.title;

            if (title == 'Transaction Failed') {
                var op = error.response.data.extras.result_codes.operations[0];
                try {
                    title = this.errors(op);
                } catch (err) {
                    title = title;
                }
            }

            return title;
        } catch (er) {
            return er;
        }
    }
}

const util = new StellarUtil();

module.exports = util;