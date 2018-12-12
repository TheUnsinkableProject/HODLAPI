const Account = require('../util/accountFunctions');
 

module.exports = [
  
    {
        method: 'GET',
        path: '/api/v1/account/getbalance',
        config: {
            handler: (req, reply) => {
                Account.getBalance(req, res => {
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
        path: '/api/v1/account/get',
        config: {
            handler: (req, reply) => {
                Account.getActiveAccount(req, res => {
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
        path: '/api/v1/account/send',
        config: {
            handler: (req, reply) => {
                Account.sendAsset(req, res => {
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
        path: '/api/v1/account/transactions',
        config: {
            handler: (req, reply) => {
                Account.getTransactions(req, res => {
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
        path: '/api/v1/account/merge',
        config: {
            handler: (req, reply) => {
                Account.merge(req, res => {
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
        path: '/api/v1/account/addkeypair',
        config: {
            handler: (req, reply) => {
                Account.addKeypair(req, res => {
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
        path: '/api/v1/account/getsecretkey',
        config: {
            handler: (req, reply) => {
                Account.getSecretKey(req, res => {
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
        path: '/api/v1/account/offers/{type}',
        config: {
            handler: (req, reply) => {
                Account.account_offers(req, res => {
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
        path: '/api/v1/offers',
        config: {
            handler: (req, reply) => {
                Account.offers(req, res => {
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
        path: '/api/v1/account/offer/cancel',
        config: {
            handler: (req, reply) => {
                Account.cancelOffer(req, res => {
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
        path: '/api/v1/account/manage_offer',
        config: {
            handler: (req, reply) => {
                Account.manageOffer(req, res => {
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
        path: '/api/v1/buyback',
        config: {
            handler: (req, reply) => {
                Account.buyBack(req, res => {
                    reply(res);
                });
            }
        }
    },
    {
        method: 'POST',
        path: '/api/v1/hodl/locksell',
        config: {
            handler: (req, reply) => {
                Account.lockNoSell(req, res => {
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