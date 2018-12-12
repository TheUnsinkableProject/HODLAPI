var CryptoJS = require("crypto-js");

function encryptData(data, password) {
    var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), password);
    return ciphertext.toString();
}

function decryptData(data, password) { 
    try {
        var bytes  = CryptoJS.AES.decrypt(data, password);
       
        var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

        return decryptedData;
    } catch (err) {
        return err;
    }
}

module.exports = {
    encryptData: encryptData,
    decryptData: decryptData
}