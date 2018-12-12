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

const Admin = require('../models/Admin');
const User = require('../../users/models/User');
const Account = require('../../accounts/models/Account');
const helper = require('../../util/helper');


/**
 *
 * @param req
 * @param res
 */
function verifyCredentials(request, res) {
    const password = request.payload.password;
 
    Admin.one({
        email: request.payload.email
    }, function (error, admin) {
        if (admin) {
            bcrypt.compare(password, admin.password, (err, isValid) => {
                if (isValid) {
                    res(admin);
                } else {
                    res(Boom.badRequest(request.i18n.__('Incorrect password!')));
                }
            });
        } else {
            res(Boom.badRequest(request.i18n.__('Incorrect username or email!')));
        }
    });
}

module.exports = {
    verifyCredentials
}