var orm = require('orm');
require('dotenv').load();
const logger = require('../plugins/util/logger.js');

var DB_USERNAME = process.env.DB_USERNAME;
var DB_PASSWORD = process.env.DB_PASSWORD;
var DB_SERVER = process.env.DB_SERVER;
var DB_DATABASE = process.env.DB_DATABASE;

var dns = 'mysql://' + DB_USERNAME + ':' + DB_PASSWORD + '@' + DB_SERVER + '/' + DB_DATABASE;

//load database
//var db = orm.connect(dns);

var opts = {
    host: DB_SERVER,
    user: DB_USERNAME,
    database: DB_DATABASE,
    password: DB_PASSWORD,
    protocol: 'mysql',
    port: '3306',
    query: {pool: true}
};
var db = orm.connect(opts);

db.on('connect', function (err) {
    if (err) {
        logger.debug('Mysql Connection error: ' + err);
        return console.error('Connection error: ' + err);
    }
    logger.info('Mysql connection success');
});

// setInterval(() => {
//     logger.info('SELECT 1');
//     db.driver.execQuery("SELECT 1", function (err, data) {});
//     logger.info('SELECT 2');
// }, 50000);

module.exports = db;