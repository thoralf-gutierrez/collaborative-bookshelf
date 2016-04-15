

angular.module('CollaborativeBookshelfApp.controllers',[]).

controller('AppController', function($scope, $state, $mdSidenav, popupService, AuthService, AUTH_EVENTS) {
    $scope.user = {
        id: AuthService.user_id(),
        name: AuthService.user_name(),
        email: AuthService.user_email(),
        picture: AuthService.user_picture(),
        google_id: AuthService.user_google_id()
    };

    $scope.$on(AUTH_EVENTS.notAuthorized, function(event) {
        popupService.showPopup('Unauthorized! You are not allowed to access this resource.');
    });

    $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
        AuthService.logout();
        $state.go('login');
        popupService.showPopup('Session Lost! Sorry, You have to login again.');
    });

    $scope.setCurrentUserInfo = function(id, name, email, picture, google_id) {
        $scope.user = {
            id: id,
            name: name,
            email: email,
            picture: picture,
            google_id: google_id
        };
    };

    $scope.isAuthenticated = function() {
        return AuthService.isAuthenticated();
    };

    $scope.logout = function() {
        AuthService.logout();
        $scope.user = undefined;
        $state.go('login');
    };

    $scope.goToBooks = function(){
        $state.go('books');
        $mdSidenav('left').toggle();
    };

    $scope.goToActivity = function(){
        $state.go('activity');
        $mdSidenav('left').toggle();
    };

    $scope.goToUsers = function(){
        $state.go('users');
        $mdSidenav('left').toggle();
    };

    $scope.goToMe = function(){
        $state.go('viewUser', {id:$scope.user.google_id});
        $mdSidenav('left').toggle();
    };
    
    $scope.goToVoting = function(){
        $state.go('voting');
        $mdSidenav('left').toggle();
    };

    $scope.emailFeedback = function() {
        var link = "mailto:thoralf.gutierrez@realimpactanalytics.com?subject=Library%20App%20Feedback&body=I%20want%20some%20more%20features!%20https%3A%2F%2Fyoutu.be%2FsZrgxHvNNUc";
        window.open(link,'_blank');
    };
}).

controller('BookListController',function($scope, $mdSidenav, $state, popupService, $window, Book, Recommendations){


    $scope.toggleSidenav = function() {
        $mdSidenav('left').toggle();
    };

    $scope.books = Book.query( {acquired: true}, function() {
        $scope.books.map( function(book) {
            book.is_recommended = Recommendations.is_recommended(book, $scope.user);
        });
    });

    $scope.toggle_recommend = function(book) {
        Recommendations.toggle_recommend(book, $scope.user);
    };

}).

controller('VotingController',function($scope, $mdSidenav, $state, popupService, $window, Book, Votes){


    $scope.toggleSidenav = function() {
        $mdSidenav('left').toggle();
    };

    $scope.books = Book.query( {acquired: false}, function() {
        $scope.books.map( function(book) {
            book.is_voted = Votes.is_voted(book, $scope.user);
        });
    });

    $scope.toggle_vote = function(book) {
        Votes.toggle_vote(book, $scope.user);
    };

}).

controller('BookViewController',function($scope,$stateParams,popupService,$sanitize,$mdToast,Book,Activity, Recommendations){

    $scope.book = Book.get({id:$stateParams.id}, function() {
        $scope.book.is_recommended = Recommendations.is_recommended($scope.book, $scope.user);
    });
    
    $scope.sanitizedDescription = function(){
        return $sanitize($scope.book.description);
    };

    $scope.toggle_recommend = function() {
        Recommendations.toggle_recommend($scope.book, $scope.user);
    };

    $scope.subscribe = function() {
        popupService.showPopup('Coming soon ;-)');
    };

    $scope.borrow = function(){
        var latestBook = Book.get({id:$stateParams.id}, function() {
            // check that book is still available
            if (latestBook.borrowed_by === undefined) {
                $scope.book.borrowed_by = $scope.user;

                $scope.book.$update( function() {

                var activity = new Activity();
                activity.type = 'borrow';
                activity.user = $scope.user;
                activity.book = $scope.book._id;

                activity.$save();


                    var toast = $mdToast.simple()
                                      .textContent("Book borrowed")
                                      .position('top right');
                    $mdToast.show(toast);

                });

            } else {
                popupService.showPopup('Sorry, book has already been borrowed');
                $scope.book = latestBook;
            }
        });
    };

    $scope.return = function(){
        var latestBook = Book.get({id:$stateParams.id}, function() {
            // check that this user borrowed the book
            if (latestBook.borrowed_by.google_id == $scope.user.google_id) {
                $scope.book.borrowed_by = undefined;

                $scope.book.$update( function() {

                    var activity = new Activity();
                    activity.type = 'return';
                    activity.user = $scope.user;
                    activity.book = $scope.book._id;

                    activity.$save();

                    var toast = $mdToast.simple()
                                      .textContent("Book is now available")
                                      .position('top right');
                    $mdToast.show(toast);
                });

            } else {
                popupService.showPopup("Sorry, you are not the user that borrowed the book so you can't return it");
                $scope.book = latestBook;
            }
        });
    };

    $scope.goBack = function() {
      window.history.back();
    };

}).


controller('VotingBookViewController',function($scope,$stateParams,popupService,$sanitize,$mdToast,Book,Activity, Votes){

    $scope.book = Book.get({id:$stateParams.id}, function() {
        $scope.book.is_voted = Votes.is_voted($scope.book, $scope.user);
    });
    
    $scope.sanitizedDescription = function(){
        return $sanitize($scope.book.description);
    };

    $scope.toggle_vote = function() {
        Votes.toggle_vote($scope.book, $scope.user);
    };

    $scope.goBack = function() {
      window.history.back();
    };

}).

controller('BookCreateController',function($scope,$state,$stateParams,$mdToast,Book,GoogleBooks,Goodreads,Activity){

    $scope.book = new Book();
    $scope.book.acquired = true;
    $scope.book.authors = Array();
    $scope.book.categories = Array();
    $scope.loading_goodreads = false;
    $scope.loading_googlebooks = false;

    $scope.validGoogleId = function(){
        return GoogleBooks.validId($scope.book.google_id);
    };

    $scope.validGoodreadsId = function(){
        return $scope.book.goodreads_id !== undefined && $scope.book.goodreads_id.length >= 1 && !isNaN($scope.book.goodreads_id);
    };

    $scope.loadFromGoogleBooks = function(){
        $scope.loading_googlebooks = true;
        GoogleBooks.loadBook($scope.book, $scope);
    };

    $scope.loadFromGoodreads = function(){
        $scope.loading_goodreads = true;
        Goodreads.loadRatings($scope.book, $scope);
    };

    $scope.$watch('book.google_id', function() {
        if (GoogleBooks.validUrl($scope.book.google_id)) {
            $scope.book.google_id = GoogleBooks.extractId($scope.book.google_id);
            $scope.loadFromGoogleBooks();
        }
    });

    $scope.$watch('book.goodreads_id', function() {
        if (Goodreads.validUrl($scope.book.goodreads_id)) {
            $scope.book.goodreads_id = Goodreads.extractId($scope.book.goodreads_id);
            $scope.loadFromGoodreads();
        }
    });

    $scope.addBook = function(){
        $scope.book.$save(function(){
            
            var activity = new Activity();
            activity.type = 'add';
            activity.user = $scope.user;
            activity.book = $scope.book._id;

            activity.$save();

            var toast = $mdToast.simple()
                                      .textContent("Book added")
                                      .position('top right');
            $mdToast.show(toast);

            $state.go('books');
        });
    };

}).

controller('VotingBookCreateController',function($scope,$state,$stateParams,$mdToast,Book,GoogleBooks,Goodreads){

    $scope.book = new Book();
    $scope.book.acquired = false;
    $scope.book.authors = Array();
    $scope.book.categories = Array();
    $scope.loading_goodreads = false;
    $scope.loading_googlebooks = false;

    $scope.validGoogleId = function(){
        return GoogleBooks.validId($scope.book.google_id);
    };

    $scope.validGoodreadsId = function(){
        return $scope.book.goodreads_id !== undefined && $scope.book.goodreads_id.length >= 1 && !isNaN($scope.book.goodreads_id);
    };

    $scope.loadFromGoogleBooks = function(){
        $scope.loading_googlebooks = true;
        GoogleBooks.loadBook($scope.book, $scope);
    };

    $scope.loadFromGoodreads = function(){
        $scope.loading_goodreads = true;
        Goodreads.loadRatings($scope.book, $scope);
    };

    $scope.$watch('book.google_id', function() {
        if (GoogleBooks.validUrl($scope.book.google_id)) {
            $scope.book.google_id = GoogleBooks.extractId($scope.book.google_id);
            $scope.loadFromGoogleBooks();
        }
    });

    $scope.$watch('book.goodreads_id', function() {
        if (Goodreads.validUrl($scope.book.goodreads_id)) {
            $scope.book.goodreads_id = Goodreads.extractId($scope.book.goodreads_id);
            $scope.loadFromGoodreads();
        }
    });

    $scope.addBook = function(){
        $scope.book.$save(function(){
            
            var toast = $mdToast.simple()
                                      .textContent("Book added")
                                      .position('top right');
            $mdToast.show(toast);

            $state.go('voting');
        });
    };

}).

controller('BookEditController',function($scope,$state,$stateParams,$window,$mdToast,popupService,Book,GoogleBooks,Goodreads,Activity){

    $scope.edit_mode = true;
    $scope.loading_goodreads = false;
    $scope.loading_googlebooks = false;

    $scope.updateBook = function(){
        $scope.book.$update(function(){
            var activity = new Activity();
                
            activity.type = 'modify';
            activity.user = $scope.user;
            activity.book = $scope.book._id;
            activity.before = $scope.original_state;
            activity.after = $scope.book;

            activity.$save();

            $state.go('viewBook', {id: $stateParams.id});
        });
    };

    $scope.validGoogleId = function(){
        return GoogleBooks.validId($scope.book.google_id);
    };

    $scope.validGoodreadsId = function(){
        return $scope.book.goodreads_id !== undefined && $scope.book.goodreads_id.length >= 1 && !isNaN($scope.book.goodreads_id);
    };

    $scope.loadFromGoogleBooks = function(){
        $scope.loading_googlebooks = true;
        GoogleBooks.loadBook($scope.book, $scope);
    };

    $scope.loadFromGoodreads = function(){
        $scope.loading_goodreads = true;
        Goodreads.loadRatings($scope.book, $scope);
    };

    $scope.loadBook = function(){
        $scope.book = Book.get({id:$stateParams.id}, function(){
                        
            // save original state for logging purpposes
            $scope.original_state = {};

            for (var attr in $scope.book) {
                // Avoiding the $resolved attribute which isn't really part of our object
                if ($scope.book.hasOwnProperty(attr) && attr != '$resolved')
                    $scope.original_state[attr] = $scope.book[attr];
            }
        });
    };

    $scope.loadBook();

    $scope.$watch('book.google_id', function() {
        if (GoogleBooks.validUrl($scope.book.google_id)) {
            $scope.book.google_id = GoogleBooks.extractId($scope.book.google_id);
            $scope.loadFromGoogleBooks();
        }
    });

    $scope.$watch('book.goodreads_id', function() {
        if (Goodreads.validUrl($scope.book.goodreads_id)) {
            $scope.book.goodreads_id = Goodreads.extractId($scope.book.goodreads_id);
            $scope.loadFromGoodreads();
        }
    });
    
    $scope.deleteBook = function(book){
        if(popupService.askPopup('Really delete this?')){
            book.$delete(function(){
                var activity = new Activity();
                
                activity.type = 'delete';
                activity.user = $scope.user;
                activity.book = $scope.book._id;

                activity.$save();

                var toast = $mdToast.simple()
                                      .textContent("Book deleted")
                                      .position('top right');
                $mdToast.show(toast);

                $state.go('books');
            });
        }
    };

}).

controller('VotingBookEditController',function($scope,$state,$stateParams,$window,$mdToast,popupService,Book,GoogleBooks,Goodreads,Activity){

    $scope.edit_mode = true;
    $scope.voting_mode = true;
    $scope.loading_goodreads = false;
    $scope.loading_googlebooks = false;

    $scope.updateBook = function(){
        $scope.book.$update(function(){
            $state.go('viewVotingBook', {id: $stateParams.id});
        });
    };

    $scope.validGoogleId = function(){
        return GoogleBooks.validId($scope.book.google_id);
    };

    $scope.validGoodreadsId = function(){
        return $scope.book.goodreads_id !== undefined && $scope.book.goodreads_id.length >= 1 && !isNaN($scope.book.goodreads_id);
    };

    $scope.loadFromGoogleBooks = function(){
        $scope.loading_googlebooks = true;
        GoogleBooks.loadBook($scope.book, $scope);
    };

    $scope.loadFromGoodreads = function(){
        $scope.loading_goodreads = true;
        Goodreads.loadRatings($scope.book, $scope);
    };

    $scope.loadBook = function(){
        $scope.book = Book.get({id:$stateParams.id});
    };

    $scope.loadBook();

    $scope.$watch('book.google_id', function() {
        if (GoogleBooks.validUrl($scope.book.google_id)) {
            $scope.book.google_id = GoogleBooks.extractId($scope.book.google_id);
            $scope.loadFromGoogleBooks();
        }
    });

    $scope.$watch('book.goodreads_id', function() {
        if (Goodreads.validUrl($scope.book.goodreads_id)) {
            $scope.book.goodreads_id = Goodreads.extractId($scope.book.goodreads_id);
            $scope.loadFromGoodreads();
        }
    });

    $scope.deleteBook = function(book){
        if(popupService.askPopup('Really delete this?')){
            book.$delete(function(){
                
                var toast = $mdToast.simple()
                                      .textContent("Book deleted")
                                      .position('top right');
                $mdToast.show(toast);

                $state.go('voting');
            });
        }
    };

    $scope.aquireBook = function(){
        
        $scope.book.acquired = true;
        $scope.book.voted_by = undefined;

        $scope.book.$update(function(){
            
            var activity = new Activity();
            activity.type = 'add';
            activity.user = $scope.user;
            activity.book = $scope.book._id;

            activity.$save();

            var toast = $mdToast.simple()
                                      .textContent("Book added")
                                      .position('top right');
            $mdToast.show(toast);

            $state.go('books');
        });
    };

}).

controller('LoginController', function ($scope, $state, popupService, AuthService) {
    $scope.login = function() {
        AuthService.login().then(function(authenticated) {
            $state.go('books', {}, {reload: true});
            $scope.setCurrentUserInfo(authenticated.id, authenticated.name, authenticated.email, authenticated.picture, authenticated.google_id);
        }, function(err) {
            popupService.showPopup('Login failed! Please check your credentials!');
        });
    };

}).

controller('ActivityController',function($scope,$mdSidenav,Activity){

    $scope.toggleSidenav = function() {
        $mdSidenav('left').toggle();
    };

    $scope.activities = Activity.query();
}).

controller('UserListController',function($scope, $mdSidenav, User){

    $scope.toggleSidenav = function() {
        $mdSidenav('left').toggle();
    };

    $scope.users = User.query();

}).

controller('UserViewController',function($scope, $state, $stateParams, $window, User, Book){

    $scope.user_to_show = User.get({google_id:$stateParams.id}, function() {
        var borrowed_by_query = {'borrowed_by':$scope.user_to_show.google_id};
        $scope.borrowed_books = Book.query(borrowed_by_query, function() {});

        var recommended_by_query = {'recommended_by': $scope.user_to_show._id };
        $scope.recommended_books = Book.query(recommended_by_query, function() {});

        var voted_by_query = {'voted_by': $scope.user_to_show._id };
        $scope.voted_books = Book.query(voted_by_query, function() {});
    });

});


