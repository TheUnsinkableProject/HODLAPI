const User = require('../models/User');
const Account = require('../../accounts/models/Account');

const getUser = (userId) => {
    return new Promise((resolve, reject) => {
        User.get(userId, (error, user) => {
            if (error) {
                return reject(error);
            } else {
                console.log('Get User function');
                return resolve(user);
            }
        });
    });
};

const getAccount = (userId) => {
    return new Promise((resolve, reject) => {
        Account.one({user_id: userId, is_primary: 1}, (error, account) => {
            if (error) {
                return reject(error);
            } else {
                console.log('Get account function');
                return resolve(account);
            }
        });
    });
};

const getAccountByEmail = (email) => {
    return new Promise((resolve, reject) => {
        Account.one({email: email, is_primary: 1}, (error, account) => {
            if (error) {
                return reject(error);
            } else {
                console.log('Get account function');
                return resolve(account);
            }
        });
    });
};


module.exports = {
    getUser,
    getAccount,
    getAccountByEmail
}