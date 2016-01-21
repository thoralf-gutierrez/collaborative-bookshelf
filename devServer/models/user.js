var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    name: String,
    email: String,
    picture: String,
	google_id: String
});

module.exports = mongoose.model('User', UserSchema);