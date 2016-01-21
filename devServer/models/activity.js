var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ActivitySchema = new Schema({
    type: String,
    user: {
        name: String,
        picture: String,
        google_id: String
    },
    book : { type: Schema.Types.ObjectId, ref: 'Book' }
}, { timestamps: true });

ActivitySchema.set('strict', false);

module.exports = mongoose.model('Activity', ActivitySchema);