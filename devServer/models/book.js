var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var BookSchema   = new Schema({
    title: String,
    subtitle: String,
	google_id: String,
	goodreads_id: String,
    authors: [String],
    publisher: String,
    published_date: String,
    description: String,
    categories: [String],
    thumbnail: String,
    language: String,
    borrowed_by: {
        name: String,
        picture: String,
        google_id: String
    },
    google_ratings_avg: Number,
    google_ratings_count: Number,
    goodreads_ratings_avg: Number,
    goodreads_ratings_count: Number,
});

module.exports = mongoose.model('Book', BookSchema);