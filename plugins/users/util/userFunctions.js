'use strict';

const Boom = require('boom');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');

const stellar = require('../../util/stellar-util');
const crypto = require('../../util/crypto');
const common = require('../../util/common');
const logger = require('../../util/logger');
const token = require('../../util/token');
const secret = require('../../../config/config');

const User = require('../models/User');
const UserHelper = require('./modelHelper');
const Account = require('../../accounts/models/Account');
const helper = require('../../util/helper');


/**
 *
 * @param request
 * @param callback
 */
function signup(request, callback) {
    let data = request.payload;

    logger.info('Start createUser: ' + data.email);
    
    if (data.email == null || new String(data.email).length <= 1) {
        callback(Boom.badRequest(request.i18n.__("Email is required")));
        return;
    } else {
        if (!helper.validateEmail(data.email)) {
            callback(Boom.badRequest(request.i18n.__("Wrong email")));
            return;
        }
    }

    if (data.name == null || new String(data.name).length <= 1) {
        callback(Boom.badRequest(request.i18n.__("Name is required")));
        return;
    }
    
    logger.info('Start after checking data: ' + data.email);
    User.one({
            email: request.payload.email
        },
        function (error, user) {
            logger.info('Find User data');
            if (error) {
                logger.debug(error);
                callback(Boom.badRequest(request.i18n.__('Something wrong ;(')));
            } else {
                if (user == null) {
                    bcrypt.hash(request.payload.password, 10, function (err, hash) {

                        var newRecord = {};
                        newRecord.email = request.payload.email;
                        newRecord.name = request.payload.name;
                        newRecord.password = hash;
                        newRecord.status = 1;
                        newRecord.created_at = new Date();

                        logger.info('Create DB user');
                        User.create(newRecord, (err, results) => {
                            if (err) {
                                logger.debug('createUser2 Error');
                                logger.debug(err);
                                callback(Boom.badRequest(request.i18n.__('System could not create user ;(')));
                            } else {
                                var user = results;
                                
                                //send welcome message to user
                                //sgMail.welcome(user.email, user.name, request.i18n.__('Welcome to VNTPay'), request.headers.language);

                                logger.info('Start Create stellar account');
                                //create stellar account. 
                                var stellar_account = stellar.generateNewAccount(true);
 
                                var newAccount = {};
                                newAccount.user_id = results.id;
                                newAccount.email = request.payload.email;
                                newAccount.public_key = stellar_account.public_key;
                                newAccount.private_key = crypto.encryptData(stellar_account.private_key, secret.encryptKey);
                                newAccount.is_primary = 1;
                                newAccount.status = 1;
                                newAccount.refund_xlm = 0;

                                logger.info('Create Account record DB');
                                Account.create(newAccount, (err, results) => {
                                    if (err) {
                                        logger.debug(err);
                                        callback(request.i18n.__('Something wrong ;('));
                                    } else {
                                        callback({
                                            public_key: stellar_account.public_key,
                                            refund_xlm: true,
                                            //private_key: stellar_account.private_key,
                                            id_token: token.createToken(user)
                                        });

                                        //logger.info('Create token');
                                        //generate token and send email
                                        //var randomToken = helper.randomAsciiString(50);
                                        //var verifylink = process.env.VERIFY_LINK + '/?token='+randomToken;

                                        /*var newRecord = {};
                                        newRecord.user_id = user.id;
                                        newRecord.token = randomToken;
                                        newRecord.created_at = new Date();
 
                                        UserToken.create(newRecord, (err, results) => {
                                            if (err) {
                                                logger.debug('createUser4 Error');
                                                logger.debug(err);
                                                callback(request.i18n.__('Something wrong ;('));
                                            } else {
                                                //send verification email
                                                sgMail.verifyEmail(user.email, verifylink, request.i18n.__('VNTPay verify email address'), request.headers.language);


                                                callback({
                                                    public_key: stellar_account.public_key,
                                                    private_key: stellar_account.private_key,
                                                    id_token: token.createToken(user)
                                                });
                                            }
                                        });*/
                                    }
                                });
                            }
                        });
                    });
                } else {
                    callback(Boom.methodNotAllowed(request.i18n.__("There is already user registered with the same email ") + request.payload.email));
                }
            }
        });
}

/**
 *
 * @param request
 * @param callback
 */
const getProfile =  async (request, callback) => {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);
 
    let user = await UserHelper.getUser(authUser.id);
    callback(user.showUser());
}



/**
 *
 * @param request
 * @param callback
 */
 /*
function forgotPassword(request, callback) {
    logger.info('Start Forgotpassword');
    User.one({
        email: request.payload.email
    }, function (error, user) {
        if (error) {
            logger.debug('forgotpassword Error');
            logger.debug(error);
            callback(request.i18n.__('Something wrong ;('));
        } else {
            if (user) {
                //generate token
                var randomToken = helper.randomAsciiString(50);
                var resetlink = process.env.FORGOT_LINK + '/?token=' + randomToken;

                //send email
                sgMail.forgotPass(user.email, resetlink);

                //update user
                user.remember_token = randomToken;
                user.save(function (error) {});

                callback({
                    message: request.i18n.__("Recovery link has been sent to your email")
                });
            } else {
                callback(Boom.methodNotAllowed(request.i18n.__("This email is not exist")));
            }
        }
    });
}
*/
/**
 *
 * @param req
 * @param res
 */
function verifyCredentials(request, res) {    
    logger.info('Start verifyCredentials');
    const password = request.payload.password;
 
    User.one({
        email: request.payload.email
    }, function (error, user) {
        logger.info('get user from db');
        if (user) {
            logger.info('user exsit ' + user.email);
            bcrypt.compare(password, user.password, (err, isValid) => {
                logger.info('password is valid');
                if (isValid) {
                    if (user.status == 0) {
                        res(Boom.badRequest(request.i18n.__('Your account disabled, contact administration!')));
                    } else {
                        //send notifcation
                        //sgMail.login(user.email, request.i18n.__('VNTPay Login Notification'), request.headers.language);

                        Account.one({user_id: user.id, is_primary: 1}, (error, account) => {
                            user.refund_xlm = account.isRefundXLM();
                            user.account = account.public_key;
                            res(user);
                        });
                    }
                } else {
                    logger.debug('incorrect pass');
                    logger.debug(err);
                    res(Boom.badRequest(request.i18n.__('Incorrect password!')));
                }
            });
        } else {
            logger.debug('Verfy user error');
            logger.debug(error);
            res(Boom.badRequest(request.i18n.__('Incorrect username or email!')));
        }
    });
}


/**
 *
 * @param req
 * @param res
 */
function verifyUniqueUser(req, res) {
    // Find an entry from the database that
    // matches either the email or username
    User.one({
        email: req.payload.email
    }, (err, user) => {
        // Check whether the username or email
        // is already taken and error out if so
        if (user) {
            if (user.email === req.payload.email) {
                res(Boom.badRequest(request.i18n.__('Email taken')));
            }
        }
        // If everything checks out, send the payload through
        // to the route handler
        res(req.payload);
    });
}

/**
 *
 * @param request
 * @param callback
 */
const updateUser = async (request, callback) => {
    let authUser = token.getAuthenticatedUser(request.headers.authorization);
    let data = request.payload;

    if (data.name == null || new String(data.name).length <= 1) {
        callback(Boom.badRequest(request.i18n.__("Name is required")));
        return;
    } 

    let user = await UserHelper.getUser(authUser.id);

    user.name = data.name;
    user.save((err)=> {
        if (err) {
            callback(Boom.methodNotAllowed(request.i18n.__("Update user failed")));
        }
        callback({
            'message' : 'Updated user successfully'
        });
    });
}

const getBalance =  async (request, callback) => {
    logger.info('Start Get Balance');
    let authUser = token.getAuthenticatedUser(request.headers.authorization)

    //var user = await modelHelper.getUser(authUser.id);
   // var account = await modelHelper.getAccount(authUser.id);
   // var public_key = account.public_key;

    /*common.getBalancewithCash(authUser.id, public_key, 'gbp').then(balance => {
        callback(balance);  
    }).catch(err => {
        callback(err);
    });*/
}


module.exports = {
    verifyUniqueUser,
    verifyCredentials,
    signup,
    getBalance,
    getProfile,
    updateUser
}