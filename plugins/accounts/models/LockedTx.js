'use strict';

const db = require('../../../config/database');

var LockedTx = db.define("locked_tx", {
  user_id    : Number,
  account: String,
  target_amount: Number,
  hodl_account : String,
  tx: String,
  asset: String,
  status: String,
  is_backup: String,
  created_at: Date
}, {
    methods: {
        // getInfo: function() {
        //     return {
        //         'account': this.public_key, 
        //         'is_default': this.is_primary == 1 ? 'Y' : 'N'
        //     };
        // },
        // isRefundXLM: function() {
        //     return this.refund_xlm == 0 ? true : false;
        // }
    }
}); 

module.exports = LockedTx;