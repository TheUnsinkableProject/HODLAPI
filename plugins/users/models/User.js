'use strict';

const db = require('../../../config/database');

var User = db.define("users", {
  name    : String,
  email : String,
  password: String,
  status: Number,
  created_at: Date,
  updated_at: Date,
  is_verified: String,
  remember_token: String
}, {
    methods: {
        getAddress: function() {
            //return this.email + '*' + process.env.VNT_DOMAIN;
        },
        showUser: function() {
            return {
                "name": this.name,
                "email": this.email,
                "is_verified": this.verified()
            };
        },
        verified: function() {
            return this.is_verified == 'Y' ? true : false;
        }
    }
}); 

module.exports = User;