'use strict';

const db = require('../../../config/database');

var Account = db.define("accounts", {
  user_id    : Number,
  email: String,
  public_key : String,
  private_key: String,
  is_primary: Number,
  status: Number,
  refund_xlm: Number
}, {
    methods: {
        getInfo: function() {
            return {
                'account': this.public_key, 
                'is_default': this.is_primary == 1 ? 'Y' : 'N'
            };
        },
        isRefundXLM: function() {
            return this.refund_xlm == 0 ? true : false;
        }
    }
}); 

module.exports = Account;