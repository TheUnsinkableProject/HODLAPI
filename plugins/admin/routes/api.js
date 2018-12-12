const Admin = require('../util/adminFunctions');
const token = require('../../util/token');

module.exports = [    
    {
        method: 'POST',
        path: '/api/v1/admin/authentication',
        config: {
            // Check the user's password against the DB
            pre: [
                {method: Admin.verifyCredentials, assign: 'admin'}
            ],
            handler: (req, res) => {
                // If the user's password is correct, we can issue a token.
                // If it was incorrect, the error will bubble up from the pre method
                var info = {
                    email: req.pre.admin.email,
                    id_token: token.createToken(req.pre.admin)
                }
                res(info).code(201);
            },
            validate: {
                //payload: authenticateUserSchema
            }
        }
    },

    {
        method: 'GET',
        path: '/api/v1/admin/users',
        config: {
            handler: (req, reply) => {
                Admin.getUsers(req, res => {
                    reply(res);
                });
            },
            // Add authentication to this route
            auth: {
                strategy: 'jwt',
            }
        }
    },
];