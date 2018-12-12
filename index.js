'use strict';

const Hapi = require('hapi');
const Boom = require('boom');
const glob = require('glob');
const path = require('path');
var fs = require('fs');
const secret = require('./config');
const db = require('./config/database');
const corsHeaders = require('hapi-cors-headers');
const i18n = require('hapi-i18n');
require('dotenv').load();

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

//  const StellarUtils = require('./plugins/util/stellar-util');
//  StellarUtils.single_transactions().then(function(t) {
//      console.log(t.memo);
//  })

i18n.options = {
    locales: ['zh', 'en'],
    directory: __dirname + '/locales',
    languageHeaderField: 'language',
    defaultLocale: 'en'
}


//Init Server
const server = new Hapi.Server();

//Config HeroKu port
let port = process.env.PORT || 3000;

if (process.env.ENABLED_SSL == 'Y') {
    var tls = {
        key: fs.readFileSync('./cert/star_vntpay_co.key'),
        cert: fs.readFileSync('./cert/STAR_vntpay_co.crt'),
        ca: fs.readFileSync('./cert/STAR_vntpay_co.ca-bundle'),
    };

    server.connection({
        address: '0.0.0.0',
        port: port,
        tls: tls
    });
} else {
    server.connection({
        host: '0.0.0.0',
        port: port
    });
}


//Allow Cross Origin Access
server.ext('onPreResponse', corsHeaders);


// Add the route
server.register([require('hapi-auth-jwt'), require('inert'), i18n], (err) => {

    // We're giving the strategy both a name and scheme of 'jwt'
    server.auth.strategy('jwt', 'jwt', {
        key: secret,
        verifyOptions: {
            algorithms: ['HS256']
        }
    });

    

    glob.sync('plugins/**/routes/*.js', {
        root: __dirname
    }).forEach(file => {
        const route = require(path.join(__dirname, file));
        server.route(route);
    });
});

// Start the server
server.start((err) => {
    if (err) {
        throw err;
    }
    // console.log('Server running at:', server.info.uri);
});