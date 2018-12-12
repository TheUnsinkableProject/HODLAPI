'use strict';

const Boom = require('boom');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');

const stellar = require('./stellar-util');
const crypto = require('./crypto');
const logger = require('./logger');
const token = require('./token');

const User = require('../users/models/User');
const Account = require('../accounts/models/Account');
const modelHelper = require('../users/util/modelHelper');

const helper = require('./helper');



const getBalance = async (public_key) => {
    return new Promise((resolve, reject) => {
        stellar.balances(public_key).then(function (balance) {
            // if (balance.VNT == null) {
            //    // balance.VNT = '0.0000000';
            // }

            var url = 'https://api.coinmarketcap.com/v1/ticker/stellar/?convert=GBP';

            axios.get(url)
                .then((info) => {
                    logger.info('Get coinmarketcap prices');
                    var data = info.data[0];

                    var XLM_USD = data.price_usd * parseFloat(balance.XLM);
                   // var XLM_GBP = data.price_gbp * parseFloat(balance.XLM);
                    balance.XLM_USD = XLM_USD.toFixed(2);
                   // balance.XLM_GBP = XLM_GBP.toFixed(2);

                    // var VNT_USD = data.price_usd * parseFloat(balance.VNT) / 2;
                    // var VNT_GBP = data.price_gbp * parseFloat(balance.VNT) / 2;
                    // balance.VNT_USD = VNT_USD.toFixed(2);
                    // balance.VNT_GBP = VNT_GBP.toFixed(2);

                    balance.XLM_PRICES = {};
                    balance.XLM_PRICES.USD = data.price_usd;
                    //balance.XLM_PRICES.GBP = data.price_gbp;

                    // balance.VNT_PRICES = {};
                    // balance.VNT_PRICES.USD = (parseFloat(data.price_usd) / 2).toFixed(2);
                    // balance.VNT_PRICES.GBP = (parseFloat(data.price_gbp) / 2).toFixed(2);
                    // balance.VNT_PRICES.XLM = "0.5";

                    logger.info('coinmarketcap balance ready');

                    return resolve(balance);

                })
                .catch((error) => {
                    logger.debug('Marketcap error');
                    logger.debug(error);

                    var balance = {};
                    
                    balance.XLM_USD = '0';
                    //balance.XLM_GBP = '0';

                    // balance.VNT_USD = '0';
                    // balance.VNT_GBP = '0';

                    balance.XLM_PRICES = {};
                    balance.XLM_PRICES.USD = '0';
                   // balance.XLM_PRICES.GBP = '0';

                    // balance.VNT_PRICES = {};
                    // balance.VNT_PRICES.USD = '0';
                    // balance.VNT_PRICES.GBP = '0';
                    // balance.VNT_PRICES.XLM = "0";

                    return reject(balance);
                });
        }).catch(function (error) {
            logger.debug('Marketcap error2');
           // logger.info(error);
            
            var balance = {};

            balance.XLM_USD = '0';
           // balance.XLM_GBP = '0';

           // balance.VNT_USD = '0';
            //balance.VNT_GBP = '0';

            balance.XLM_PRICES = {};
            balance.XLM_PRICES.USD = '0';
           // balance.XLM_PRICES.GBP = '0';

            // balance.VNT_PRICES = {};
            // balance.VNT_PRICES.USD = '0';
            // balance.VNT_PRICES.GBP = '0';
            // balance.VNT_PRICES.XLM = "0";

            return reject(balance);
        });
    });
}


module.exports = {
    getBalance
};