const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_name:String,
    password:String,
    mail:String,
    todo:[String],
});


const User = mongoose.model('User', UserSchema);
module.exports = User; 
