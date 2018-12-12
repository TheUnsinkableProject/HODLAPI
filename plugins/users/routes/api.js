const User = require('../util/userFunctions');
const token = require('../../util/token');

module.exports = [
    {
        method: 'GET',
        path: '/',
        config: {
            handler: (req, reply) => {
                reply("Welcome");
            },
        }
    },
    {
        method: 'POST',
        path: '/api/v1/users',
        config: {
            handler: (req, reply) => {
                User.signup(req, res => {
                    reply(res);
                });
            },
            // Add authentication to this route
             auth: {
                 strategy: 'jwt',
             }
        }
    },
       
    
    {
        method: 'GET',
        path: '/api/v1/users/{id}',
        config: {
            handler: (req, reply) => {
                User.getUserByID(req, res => {
                    reply(res);
                });
            },
            // Add authentication to this route
            auth: {
                strategy: 'jwt',
            }
        }
    },
    {
        method: 'GET',
        path: '/api/v1/user/getprofile',
        config: {
            handler: (req, reply) => {
                User.getProfile(req, res => {
                    reply(res);
                });
            },
            // Add authentication to this route
            auth: {
                strategy: 'jwt',
            }
        }
    },
    {
        method: 'POST',
        path: '/api/v1/user/update',
        config: {
            handler: (req, reply) => {
                User.updateUser(req, res => {
                    reply(res);
                });
            },
            // Add authentication to this route
            auth: {
                strategy: 'jwt',
            }
        }
    },
    
    {
        method: 'POST',
        path: '/api/v1/authentication',
        config: {
            // Check the user's password against the DB
            pre: [
                {method: User.verifyCredentials, assign: 'user'}
            ],
            handler: (req, res) => {
                // If the user's password is correct, we can issue a token.
                // If it was incorrect, the error will bubble up from the pre method
                var info = {
                    email: req.pre.user.email,
                    name: req.pre.user.name,
                    refund_xlm: req.pre.user.refund_xlm,
                    account: req.pre.user.account,
                    id_token: token.createToken(req.pre.user)
                }
                res(info).code(201);
            },
            validate: {
                //payload: authenticateUserSchema
            }
        }
    },    
    {
        method: 'POST',
        path: '/api/v1/signup',
        handler: (req, reply) => {
            User.signup(req, res => {
                reply(res);
            });
        }
    },
];