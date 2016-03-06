var express        = require('express');
var app            = express();
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var ObjectId       = require('mongoose').Types.ObjectId

var port = process.env.PORT || 8080; // set our port
var staticdir = process.env.NODE_ENV === 'production' ? 'dist.prod' : 'dist.dev'; // get static files dir

// get all data/stuff of the body (POST) parameters
app.use(bodyParser.json()); // parse application/json
//app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
//app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded

app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(express.static(__dirname + '/' + staticdir)); // set the static files location /public/img will be /img for users

// models ==================================================

var Book = require('./devServer/models/book');
var User = require('./devServer/models/user');
var Activity = require('./devServer/models/activity');

// db ======================================================

var mongoose   = require('mongoose');
mongoose.connect('mongodb://collaborativebookshelf:collaborativebookshelf@localhost:27017/collaborativebookshelf'); // connect to our database

// routes ==================================================

var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    // console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
// router.get('/', function(req, res) {
//     res.json({ message: 'hooray! welcome to our api!' });   
// });

// on routes that end in /books
// ----------------------------------------------------
router.route('/books')

    .get(function(req, res) {

        if (req.query.borrowed_by) {
            query = {'borrowed_by.google_id': req.query.borrowed_by}
        } else if (req.query.recommended_by) {
            query = {'recommended_by': { $elemMatch: { $eq: new ObjectId(req.query.recommended_by) } } }
        } else if (req.query.voted_by) {
            query = {'voted_by': { $elemMatch: { $eq: new ObjectId(req.query.voted_by) } } }
        } else {
            query = {'acquired': req.query.acquired}
        }

        Book
            .find(query)
            .populate('recommended_by')
            .populate('voted_by')
            .exec(function(err, books) {
                if (err) { console.log(err); res.send(err); }
                res.json(books);
            });
    })

    .post(function(req, res) {
        
        var book = new Book(req.body);

        book.save(function(err) {
            if (err) { console.log(err); res.send(err); }
            res.json(book);
        });       
    })

// on routes that end in /books/:book_id
// ----------------------------------------------------
router.route('/books/:book_id')

    .get(function(req, res) {
        Book
            .findById(req.params.book_id)
            .populate('recommended_by')
            .populate('voted_by')
            .exec(function(err, book) {
                if (err) { console.log(err); res.send(err); }
                res.json(book);
            });
    })

    .put(function(req, res) {

        Book.findById(req.params.book_id, function(err, book) {

            if (err) { console.log(err); res.send(err); }

            book.title = req.body.title;
            book.subtitle = req.body.subtitle;
	        book.google_id = req.body.google_id;
			book.goodreads_id = req.body.goodreads_id;
		    book.authors = req.body.authors;
		    book.publisher = req.body.publisher;
		    book.published_date = req.body.published_date;
		    book.description = req.body.description;
		    book.categories = req.body.categories;
		    book.thumbnail = req.body.thumbnail;
            book.language = req.body.language;
		    book.borrowed_by = req.body.borrowed_by;
            book.recommended_by = req.body.recommended_by;
            book.voted_by = req.body.voted_by;
            book.acquired = req.body.acquired;
            book.comment = req.body.comment;
		    book.google_ratings_avg = req.body.google_ratings_avg;
		    book.google_ratings_count = req.body.google_ratings_count;
		    book.goodreads_ratings_avg = req.body.goodreads_ratings_avg;
		    book.goodreads_ratings_count = req.body.goodreads_ratings_count;

            book.save(function(err) {
                if (err) { console.log(err); res.send(err); }
                Book
                    .findById(req.params.book_id)
                    .populate('recommended_by')
                    .populate('voted_by')
                    .exec(function(err, book) {
                        if (err) { console.log(err); res.send(err); }
                        res.json(book);
                    });
            });

        });
    })

    .delete(function(req, res) {
        Book.remove({
            _id: req.params.book_id
        }, function(err, book) {
            if (err) { console.log(err); res.send(err); }
            res.json({ message: 'Successfully deleted' });
        });
    });

// on routes that end in /users
// ----------------------------------------------------
router.route('/users')

    .get(function(req, res) {
        User.find(function(err, users) {
            if (err) { console.log(err); res.send(err); }
            res.json(users);
        });
    })

    .post(function(req, res) {
        
        var user = new User(req.body);

        user.save(function(err) {
            if (err) { console.log(err); res.send(err); }
            res.json(user);
        });       
    })

// on routes that end in /users/:google_id
// ----------------------------------------------------
router.route('/users/:google_id')

    // THIS SHOULD NOT HAVE TO EXIST
    .post(function(req, res) {
        
        var user = new User(req.body);

        user.save(function(err) {
            if (err) { console.log(err); res.send(err); }
            res.json(user);
        });       
    })

    .get(function(req, res) {
        User.findOne({ google_id : req.params.google_id }, function(err, user) {
            if (err) { console.log(err); res.send(err); }
            res.json(user);
        });
    })

    .put(function(req, res) {

        User.findOne({ google_id : req.params.google_id }, function(err, user) {
            if (err) { console.log(err); res.send(err); }
            
            user.name = req.body.name;
            user.email = req.body.email;
            user.picture = req.body.picture;
            user.google_id = req.body.google_id;

            user.save(function(err) {
                if (err) {
                    console.log(err)
                    res.send(err);
                }

                res.json(user);
            });

        });
    })

    .delete(function(req, res) {
        User.remove({
            google_id : req.params.user_id 
        }, function(err, user) {
            if (err) { console.log(err); res.send(err); }
            res.json({ message: 'Successfully deleted' });
        });
    });

// on routes that end in /activities
// ----------------------------------------------------
router.route('/activities')

    .get(function(req, res) {
        Activity
            .find()
            .populate('book', '_id title thumbnail')
            .exec(function(err, activities) {
                if (err) { console.log(err); res.send(err); }
                res.json(activities);
            });
    })

    .post(function(req, res) {
        
        var activity = new Activity(req.body);

        activity.save(function(err) {
            if (err) { console.log(err); res.send(err); }
            res.json(activity);
        });       
    })

// small web scraping to fetch goodreads data
// ----------------------------------------------------
router.route('/goodreads/:goodreads_id')

    .get(function(req, res) {
        
        var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        var xmlhttp = new XMLHttpRequest();
        var url = 'https://www.goodreads.com/book/show/' + req.params.goodreads_id;

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

                response = {}

                var ratings_avg_regex = /itemprop="ratingValue">(.*?)<\/span>/g
                var ratings_count_regex = /itemprop="ratingCount">(.*?) Ratings<\/span>/g

                if (ratings_avg_regex.test(xmlhttp.responseText) && ratings_count_regex.test(xmlhttp.responseText)) {
                    
                    ratings_avg_regex.lastIndex = 0;
                    var match = ratings_avg_regex.exec(xmlhttp.responseText);
                    response.ratings_avg = match[1];

                    ratings_count_regex.lastIndex = 0;
                    var match = ratings_count_regex.exec(xmlhttp.responseText);
                    response.ratings_count = match[1].replace(",","")

                } else {
                    response.error = 'Unable to retrieve rating information'
                }

                res.json(response)
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    })
            

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);


// start app ===============================================
app.listen(port);                   // startup our app at http://localhost:8080
console.log('Starting server on port ' + port);       // shoutout to the user
exports = module.exports = app;             // expose app
