'use strict';

const jwt = require('jsonwebtoken');
const secret = require('../../config/index');

/**
 *
 * @param user
 * @returns {*}
 */
function createToken(user) {
    // Sign the JWT
    //console.log(user.id);
    return jwt.sign({id: user.id, email: user.email}, secret, {algorithm: 'HS256', expiresIn: '24h'});
}

/**
 *
 * @param autorization
 */
function getAuthenticatedUser(autorization) {
    //remove Bearer String from token
    let token = autorization.split(" ")
    let decoded = jwt.decode(token[1], {complete: true});
    return decoded.payload;

}

module.exports = {
    createToken: createToken,
    getAuthenticatedUser: getAuthenticatedUser,
};