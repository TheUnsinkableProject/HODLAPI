'use strict';

const db = require('../../../config/database');

var Admins = db.define("admins", {
  name : String,
  password: String,
  email : String
}, {
    methods: {
        
    }
}); 

module.exports = Admins;