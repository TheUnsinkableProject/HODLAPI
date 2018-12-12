'use strict';

const Boom = require('boom');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const timeago = require("timeago.js");
const BigNumber = require('bignumber.js');

const stellar = require('../../util/stellar-util');
const crypto = require('../../util/crypto');
const common = require('../../util/common');
const logger = require('../../util/logger');
const token = require('../../util/token');
const secret = require('../../../config/config');

const User = require('../../users/models/User');
const modelHelper = require('../../users/util/modelHelper');
const Account = require('../models/Account');
const LockedTx = require('../models/LockedTx');
const helper = require('../../util/helper');

function manageOffer(request, callback) {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);

    var sdkAmount, sdkPrice;
    
    //var password = request.payload.password;
    var selling = request.payload.selling;
    var buying = request.payload.buying;
    var amount = request.payload.amount;
    var price = request.payload.price;

    if (buying == 'UNSK') {
        sdkPrice = new BigNumber(1).dividedBy(price);
        sdkAmount = new BigNumber(amount).times(price).toFixed(7);
    } else {
        sdkPrice = new BigNumber(price);
        sdkAmount = new BigNumber(amount).toFixed(7);
    }

    Account.one({
        user_id: authUser.id,
        is_primary: 1
    }, (err, account) => {
        if (err) {
            console.log(err);
            callback(Boom.badRequest(request.i18n.__("an account is not exist")));
            return;
        }
        var secretKey;
        try {
            secretKey = crypto.decryptData(account.private_key, secret.encryptKey);
        } catch (e) {
            callback(Boom.badRequest(request.i18n.__("Incorrect password")));
            return;
        }

        stellar.manageOffer(secretKey, buying, selling, String(sdkAmount), String(sdkPrice)).then(res => {
            callback({
                message: request.i18n.__("Offer has been bid successfully")
            });
        }).catch(err => {
            console.log(err);
            callback(Boom.badRequest(request.i18n.__(stellar.getError(err))));
        });
    });
}


function account_offers(request, callback) {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);

    var type = request.params.type;

    Account.one({
        user_id: authUser.id,
        is_primary: 1
    }, (err, account) => {
        if (err) {
            callback(request.i18n.__('This account does not exist'));
            return;
        }

        var public_key = account.public_key;

        stellar.account_offers(public_key).then((results) => {

            var offers = [];
            results.records.forEach(function (rec) {
                var action, xlm_amount, unsk_price, unsk_amount;

                if (type == 'buy') {
                    if (rec.buying.asset_code != 'UNSK') {
                        return;
                    }
                } else if (type == 'sell') {
                    if (rec.selling.asset_code != 'UNSK') {
                        return;
                    }
                }

                if (rec.buying.asset_code == 'UNSK') {
                    action = 'buy';
                    xlm_amount = rec.amount;
                    //xlm_amount = xlm_amount.toFixed(2);
                    unsk_amount = rec.amount * rec.price;

                    unsk_price = xlm_amount / unsk_amount;   
                }
                if (rec.selling.asset_code == 'UNSK') {
                    action = 'sell';

                    xlm_amount = rec.amount * rec.price;
                   // xlm_amount = xlm_amount.toFixed(2);

                    unsk_price = rec.price;

                    unsk_amount = rec.amount;
                }

                // xlm_amount = rec.amount * rec.price;
                // xlm_amount = xlm_amount.toFixed(2);

                offers.push({
                    unsk_amount: new BigNumber(unsk_amount).toFixed(7),
                    xlm_amount: new BigNumber(xlm_amount).toFixed(7),
                    price: new BigNumber(unsk_price).toFixed(4),
                    offerID: rec.id,
                    action: action
                });
            });
            callback(offers);
        }).catch((err) => {
            callback(request.i18n.__('Something wrong ;('));
        });
    });
}

function cancelOffer(request, callback) {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);

   //var password = request.payload.password;
    var offerID = request.payload.offerid;

    Account.one({
        user_id: authUser.id,
        is_primary: 1
    }, (err, account) => {
        if (err) {
            console.log(err);
            callback(Boom.badRequest(request.i18n.__("an account is not exist")));
            return;
        }
        try {
            var secretKey = crypto.decryptData(account.private_key, secret.encryptKey);
        } catch (e) {
            callback(Boom.badRequest(request.i18n.__("Incorrect password")));
            return;
        }

        stellar.manageOffer(secretKey, 'XLM', 'UNSK', "0", "1", offerID).then(res => {
            callback({
                message: request.i18n.__("Offer has been canceled")
            });
        }).catch(err => {
            console.log(err);
            callback(Boom.badRequest(request.i18n.__('Something wrong ;(')));
        });
    });
}

function offers(request, callback) {
    stellar.offers().then((results) => {
        var offers = [];
        results.bids.forEach(function (rec) {
            var xlm_amount, unsk_price;

            xlm_amount = rec.amount * rec.price;
            xlm_amount = xlm_amount.toFixed(2);

            unsk_price = xlm_amount / rec.amount;
            unsk_price = new BigNumber(unsk_price).toFixed(4);

            offers.push({
                unsk_amount: rec.amount,
                xlm_amount: xlm_amount,
                price: unsk_price,
                action: 'sell'
            });
        });

        results.asks.forEach(function (rec) {
            var unsk_amount, unsk_price;
            unsk_amount = rec.amount * rec.price;
            unsk_amount = new BigNumber(unsk_amount).toFixed(7);

            unsk_price = rec.amount / unsk_amount;
            unsk_price = new BigNumber(unsk_price).toFixed(4);

            offers.push({
                unsk_amount: unsk_amount,
                xlm_amount: rec.amount,
                price: unsk_price,
                action: 'buy'
            });
        });

        offers.sort(function (a, b) {
            return a.price - b.price;
        });

        callback(offers);
    }).catch((err) => {
        callback(request.i18n.__('Something wrong ;('));
    });
}

function sendAsset(request, callback) {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);
    let data = request.payload;

    if (data.destination == null) {
        callback(Boom.badRequest(request.i18n.__("Enter the destination key")));
        return;
    }
    if (data.amount == null) {
        callback(Boom.badRequest(request.i18n.__("Enter the amount")));
        return;
    }
    if (data.asset == null) {
        callback(Boom.badRequest(request.i18n.__("Enter the asset")));
        return;
    }
    // if (data.password == null) {
    //     callback(Boom.badRequest(request.i18n.__("Enter the password")));
    //     return;
    // }

    Account.one({
        user_id: authUser.id,
        is_primary: 1
    }, function (err, account) {
        //user can not send to his account
        /*if (account.public_key == data.destination || account.getAddress() == data.destination) {
            callback(Boom.badRequest(request.i18n.__("User can not send to his account")));
            return;
        }*/
        
        var secretKey = crypto.decryptData(account.private_key, secret.encryptKey);
        
        if (stellar.verifyAccount(secretKey)) {
            if (stellar.isFederation(data.destination)) {
                stellar.getFederationAddress(data.destination).then(fed => {
                    stellar.sendAsset(secretKey, fed.account_id, String(data.amount), data.asset, data.memo).then((result) => {
                        var info = {
                            type: "Success",
                            name: "Success",
                            message: request.i18n.__("Asset has been sent")
                        }
                        callback(info);
                    }).catch(err => {
                        callback(Boom.badData(request.i18n.__("Something wrong ;( Transaction failed")));
                    });
                }).catch(err => {
                    callback(Boom.badData(request.i18n.__("Stellar Address is not valid")));
                });
            } else { 
                logger.info('Sending Asset');
                stellar.sendAsset(secretKey, data.destination, String(data.amount), data.asset, data.memo).then((result) => {
                    var info = {
                        type: "Success",
                        name: "Success",
                        message: request.i18n.__("Asset has been sent")
                    }
                    callback(info);
                }).catch(err => {
                   // console.log(err);
                    callback(Boom.badData(request.i18n.__("Something wrong ;( Transaction failed")));
                });
            }

        } else {
            callback(Boom.badData(request.i18n.__("Bad keys or password")));
        }
    });
}

function getActiveAccount(request, callback) {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);
 
    Account.one({
        user_id: authUser.id,
        is_primary: 1
    }, (error, account) => {
        if (error) {
            callback(Boom.badRequest(error));
        } else {
            var info = {
                account: account.public_key
            }
            callback(info);
        }
    });
}

function getTransactions(request, callback) {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);

    var dir = request.params.dir;

    Account.one({
        user_id: authUser.id,
        is_primary: 1
    }, (err, account) => {
        if (err) {
            callback(request.i18n.__('This account does not exist'));
            return;
        }

        var public_key = account.public_key;

        stellar.transactions(public_key).then((results) => {
            var payments = [];
            var count = 0;
            var cursor;
            results.records.forEach(function (rec) {
                var action, account, amount, asset;
                count++;

                if (rec.type == "payment") {
                    action = rec.from == public_key ? "Sent" : "Received";
                    account = rec.from == public_key ? rec.to : rec.from;
                    amount = rec.amount;
                    asset = rec.asset_code != null ? rec.asset_code : "XLM";
                } else if (rec.type == "create_account") {
                    action = "Funded";
                    account = rec.account == public_key ? rec.funder : rec.account;
                    amount = rec.starting_balance;
                    asset = "XLM";
                }

                if (dir == "in" && (action != "Received" && action != "Funded")) {
                    return;
                } else if (dir == "out" && action != "Sent") {
                    return;
                }

                var formated_date = timeago().format(rec.created_at);

                payments.push({
                    action: action,
                    account: account,
                    amount: amount,
                    asset: asset,
                    transaction_hash: rec.transaction_hash,
                    date: formated_date,
                    created_at: new Date(rec.created_at).toISOString().replace(/T/, ' ').replace(/\..+/, '')
                });
            });
            //callback({transactions: payments, cursor: cursor});
            callback(payments);
        }).catch((err) => {
            console.log(err);
            callback(Boom.badData(request.i18n.__('Something wrong ;(')));
        });
    });
}

/**
 *
 * @param request
 * @param callback
 */
function merge(request, callback) {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);


    // if (data.name == null || new String(data.name).length <= 1) {
    //     callback(Boom.badRequest(request.i18n.__("Name is required")));
    //     return;
    // }


    Account.one({
        user_id: userId,
        is_primary: 1
    }, (error, account) => {
        if (error) {
            return reject(error);
        } else {
            console.log('Get account function');
            return resolve(account);
        }
    });
}

/**
 *
 * @param request
 * @param callback
 */
function getSecretKey(request, callback) {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);
    var password = request.payload.password;

    User.one({
        id: authUser.id
    }, function (error, user) {
        bcrypt.compare(password, user.password, (err, isValid) => {
            logger.info('password is valid');
            if (isValid) {
                Account.one({
                    user_id: authUser.id,
                    is_primary: 1,
                    refund_xlm: 0
                }, (error, account) => {
                    if (error) {
                        callback(Boom.badRequest(error));
                    } else {
                        if (account) {
                            //1- Check the account balance
                            //2- if there is enough balance, return 2 xlm to funded account, else return error message
                            
                            stellar.balances(account.public_key).then((balance) => {
                                var xlm = parseFloat(balance.XLM);
                                if (xlm < 3) {
                                    callback(Boom.badData(request.i18n.__('No enough balance')));
                                } else {
                                    //Transfer 2 xlm to funded account
                                    //Get secret key
                                    var secretKey = crypto.decryptData(account.private_key, secret.encryptKey);
                                     
                                    //send 2 xlm
                                    try {
                                        stellar.sendAsset(secretKey, process.env.FUNDTESTACCOUNT_PK, '2', 'XLM', 'To recover secret key').then((result) => {
                                            //Refund success

                                            //Change account and remove the private key
                                            //account.private_key = crypto.encryptData(secretKey, password);
                                            account.refund_xlm = 1;
                                            account.save();

                                            var info = {
                                                private_key: secretKey
                                            }
                                            callback(info);

                                        }).catch((error) => {
                                            callback(Boom.badData(request.i18n.__('Stellar transaction failed')));
                                        });
                                    } catch (error) {
                                        callback(Boom.badData(error));
                                    }
                                }
                            }).catch((error) => {
                                callback(Boom.badData(request.i18n.__('Invalid stellar account')));
                            });
                        } else {
                            callback(Boom.badData(request.i18n.__('Account not found')));
                        }
                    }
                });
            } else {
                logger.debug('incorrect pass');
                logger.debug(err);
                callback(Boom.badRequest(request.i18n.__('Incorrect password!')));
            }
        });
    });
}

function addKeypair(request, callback) {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);

    let data = request.payload;

    if (data.password == null) {
        callback(Boom.badRequest(request.i18n.__("Enter Password")));
        return;
    } else {
        if (new String(data.password).length < 6) {
            callback(Boom.badRequest(request.i18n.__("Check Password , must have length of 6 or more characters")));
            return;
        }
    }

    if (data.private_key == null) {
        callback(Boom.badRequest(request.i18n.__("Enter Private Key")));
        return;
    } else if (!stellar.verifyAccount(data.private_key)) {
        callback(Boom.badData(request.i18n.__("Bad keys")));
        return;
    }

    
    User.get(authUser.id, function (err, user) {
        bcrypt.compare(data.password, user.password, (err, isValid) => {
            if (isValid) {
                Account.find({
                    'user_id': authUser.id
                }, (err, results) => {
                    results.forEach(function (acc) {
                        acc.is_primary = 0;
                        acc.is_new = 0;
                        acc.save();
                    }, this);

                    var newAccount = {};
                    newAccount.user_id = authUser.id;
                    newAccount.email = user.email;
                    newAccount.public_key = stellar.getPublicKey(data.private_key);
                    newAccount.private_key = crypto.encryptData(data.private_key, secret.encryptKey);
                    newAccount.is_primary = 1;
                    newAccount.status = 1;
                    newAccount.refund_xlm = 1;

                    Account.create(newAccount, (err, result) => {
                        if (err) {
                            callback(request.i18n.__('Something wrong ;('));
                        } else {
                            //Change Trust
                            // stellar.changeTrust(data.private_key, stellar.vntTokenAsset(), '999999999').then((res) => {
                            //         //Allow Trust
                            //         // stellar.allowTrust(process.env.ISSUER_PRIVATE, stellar.getPublicKey(data.private_key), stellar.vntTokenAsset(), true).then(function (res) {
                            //         //     //console.log(res);

                            //         // }).catch(function (err) {
                            //         //     //console.log(err);
                            //         // });
                            //     })
                            //     .catch(function (err) {
                            //         //console.log(err);
                            //     });

                            callback({
                                public_key: stellar.getPublicKey(data.private_key),
                                message: request.i18n.__("success")
                            });

                        }
                    });
                });
            } else {
                callback(Boom.badRequest(request.i18n.__("Check Password, Please enter correct password")));
                return;
            }
        });
    });
}

const getBuyBackAccountOffers = async (public_key) => {
    return new Promise((resolve, reject) => {
        stellar.account_offers(public_key).then((results) => {
            var total = 0;
            results.records.forEach(function (rec) {
                if (rec.buying.asset_code != 'UNSK') {
                    return;
                }

                if (rec.buying.asset_code == 'UNSK') {
                    total += rec.amount * rec.price;
                }
            });
            return resolve(total);
        }).catch((err) => {
            return reject(err);
        });
    });
}

const buyBack = async (request, callback) => {
    //1- Get Balance and check it with original balance 
    //2- If balance less than original send buy unsk offer

    let balance = await stellar.balances(process.env.BUY_BACK_OFFER_PUBLIC);
    let UNSK_balance = parseFloat(balance.UNSK);

    let total = await getBuyBackAccountOffers(process.env.BUY_BACK_OFFER_PUBLIC);
    console.log("Total Offer " + total);
    console.log("UNSK Balance " + UNSK_balance);
 
    if (UNSK_balance < process.env.BUY_BACK_AMOUNT) {
        //Create buy UNSK offer
        var amount = (process.env.BUY_BACK_AMOUNT - UNSK_balance - total).toFixed(6);
        var price = process.env.BUY_BACK_PRICE;
        console.log("final amount " + amount);
        var sdkPrice = new BigNumber(1).dividedBy(price);
        var sdkAmount = new BigNumber(amount).times(price).toFixed(7);

        var selling = 'XLM';
        var buying = 'UNSK';
        //console.log(sdkAmount);
        //console.log(String(sdkPrice));

        var secretKey = process.env.BUY_BACK_OFFER_PRIVATE;

        stellar.manageOffer(secretKey, buying, selling, String(sdkAmount), String(sdkPrice)).then(res => {
            callback({
                message: request.i18n.__("Offer has been bid successfully")
            });
        }).catch(err => {
            //console.log(err);
            callback(Boom.badRequest(request.i18n.__('Something wrong ;(')));
        });
    } else {
        callback('No Offers ' + balance.UNSK);
    } 
}

const getBalance = async (request, callback) => {
    logger.info('Start Get Balance');
    let authUser = token.getAuthenticatedUser(request.headers.authorization);

    var account = await modelHelper.getAccount(authUser.id);
    var public_key = account.public_key;

    common.getBalance(public_key).then(balance => {
        callback(balance);  
    }).catch(err => {
        callback(err);
    });
}

// 1. generate escrow keypair
// 2. transfer XLM and/or UNSK to new account
// 3. use secret key to sign and submit return tx (don't store secret key anywhere)
// 4. encrypt and store return tx xdr (no user backup? seedphrase?)
// 5. submit tx after price reached (once an SDEx order has completed at or above that price)

const lockNoSell = async (request, callback) => {
    logger.info('Start Price Lock');
    let authUser = token.getAuthenticatedUser(request.headers.authorization);
    let data = request.payload;

    if (data.amount == null) {
        callback(Boom.badRequest(request.i18n.__("Enter Amount")));
        return;
    } 
    

    //Calculate Price and Amount
    var sdkAmount, sdkPrice;
    var buying = data.buying;
    var selling = data.selling;
    var amount = data.amount;
    var price = data.price;
 
    if (buying == 'UNSK') {
        sdkPrice = new BigNumber(1).dividedBy(price);
        sdkAmount = new BigNumber(amount).times(price).toFixed(7);
    } else {
        sdkPrice = new BigNumber(price);
        sdkAmount = new BigNumber(amount).toFixed(7);
    }


    var account = await modelHelper.getAccount(authUser.id);
    if (!account) {
        callback(Boom.badRequest(request.i18n.__("Account not found!")));
        return;
    }
 
    //1. generate escrow keypair
    var hodl_account
    try {
        hodl_account = await stellar.createHODLAccount();   
    } catch (error) {
        callback(error);
        return;
    }

    //2. transfer XLM and/or UNSK to new account
    console.log("get Secret key");
    var secretKey = crypto.decryptData(account.private_key, secret.encryptKey);
    try {
        console.log("Send Asset to Holder account " + hodl_account.private_key );
        stellar.sendAsset(secretKey, hodl_account.public_key, String(sdkAmount), data.selling, 'Send to HODL account').then((result) => {
            console.log("Asset has been sent to " + hodl_account.public_key);            

            console.log("Start Offer");
            stellar.manageOffer(hodl_account.private_key, buying, selling, String(sdkAmount), String(sdkPrice)).then(res => {
                
                console.log("Building TX");
                stellar.buildTx(hodl_account.private_key, account.public_key, String(amount), buying).then((tx) => {
                    console.log("TX has been built");

                    var newRecord = {};
                    newRecord.user_id = authUser.id;
                    newRecord.account = account.public_key;
                    newRecord.target_amount = amount;
                    newRecord.hodl_account = hodl_account.public_key;
                    newRecord.tx = tx;
                    newRecord.asset = selling;
                    newRecord.status = "P";
                    newRecord.is_backup = "N";
                    newRecord.created_at = new Date();

                    LockedTx.create(newRecord, (result) => {});

                    callback({tx: tx});
                }).catch((err) => {
                    callback(err);
                });
            }).catch(err => {
                console.log(err);
                callback(Boom.badRequest(request.i18n.__(stellar.getError(err))));
            });
        }).catch((error) => {
            console.log(error);
            callback(Boom.badData(request.i18n.__('Stellar transaction failed')));
        });
    } catch (error) {
        console.log("Error from try/catch")
        console.log(error);
        callback(Boom.badData(error));
    }
}


module.exports = {
    merge,
    getBalance,
    getSecretKey,
    getActiveAccount,
    sendAsset,
    getTransactions,
    addKeypair,
    manageOffer,
    account_offers,
    cancelOffer,
    offers,
    buyBack,
    lockNoSell
}