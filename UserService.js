const crypto = require('crypto');
const SHA256 = require("crypto-js/sha256");

function Hash(password){
    const hasheddata = SHA256(password).toString()
    return hasheddata;
}
function Salt(){
    let salt = crypto.randomBytes(8).toString('hex');
    return salt;
}
module.exports = {
    Hash,
    Salt
}