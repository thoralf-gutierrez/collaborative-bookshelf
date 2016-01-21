
angular.module('CollaborativeBookshelfApp.services',[]).

factory('Book',function($resource){
    return $resource('/api/books/:id',{id:'@_id'},{
        update: {
            method: 'PUT'
        }
    });
}).

factory('User',function($resource){
    return $resource('/api/users/:google_id',{google_id:'@google_id'},{
        update: {
            method: 'PUT'
        }
    });
}).

factory('Activity',function($resource){
    return $resource('/api/activities/:id',{id:'@_id'});
}).

service('popupService',function($window){
    
    this.askPopup=function(message){
        return $window.confirm(message);
    };

    this.showPopup=function(message){
        $window.alert(message);
    };

}).

service('GoogleBooks',function($http, $mdToast){
	
	var apiKey = 'AIzaSyAPlPwE2qah_8C3XMnFIPtjFmKKXwEpgSg';
	var urlMarker = 'id=';
	var IdLength = 12;

	this.validUrl = function(s){
		return (typeof s !== 'undefined') && s.indexOf(urlMarker) > -1;
	};

	this.validId = function(s){
		return (typeof s !== 'undefined') && s.length == IdLength;
	};

	this.extractId = function(s){
		if (this.validUrl(s))
			s = s.substr(s.indexOf(urlMarker) + urlMarker.length, IdLength);
		return s;
	};

	this.loadBook=function(book, controllerScope){
	
		var url = "https://www.googleapis.com/books/v1/volumes/" + book.google_id + "?key=" + apiKey;

		$http.get(url).success(function(response){  		
     		book.title = response.volumeInfo.title;
     		book.subtitle = response.volumeInfo.subtitle;
     		book.authors = response.volumeInfo.authors;
     		book.publisher = response.volumeInfo.publisher;
     		book.published_date = response.volumeInfo.publishedDate;
     		book.description = response.volumeInfo.description;
     		book.categories = response.volumeInfo.categories;
     		book.thumbnail = response.volumeInfo.imageLinks.thumbnail;
     		book.language = response.volumeInfo.language;
     		book.google_ratings_avg = response.volumeInfo.averageRating;
     		book.google_ratings_count = response.volumeInfo.ratingsCount;

     		controllerScope.loading_googlebooks = false;
     	}).error(function(response) {
			var toast = $mdToast.simple()
                                .textContent("Unable to load book from Google Books")
                                .position('top right');
                    
            $mdToast.show(toast);

			controllerScope.loading_googlebooks = false;
		});

	};

}).

service('Goodreads',function($http, $mdToast){
	
	var idRegexp = /goodreads\.com\/book\/show\/(\d*)/g;

	this.validUrl = function(s){
		if (typeof s !== 'undefined') {
			idRegexp.lastIndex = 0;
			var match = idRegexp.exec(s);
			return match !== null;
		}
	};

	this.extractId = function(s){
		if (typeof s !== 'undefined') {
			idRegexp.lastIndex = 0;
			var match = idRegexp.exec(s);
			return match[1];
		}
	};

	this.loadRatings=function(book, controllerScope){
		url = 'api/goodreads/' + book.goodreads_id;
		$http.get(url).success(function(response) {

			if ('error' in response) {
				var toast = $mdToast.simple()
                                .textContent("Unable to load ratings from Goodreads")
                                .position('top right');
	            $mdToast.show(toast);
				controllerScope.loading_goodreads = false;
			} else {
				book.goodreads_ratings_avg = response.ratings_avg;
				book.goodreads_ratings_count = response.ratings_count;
				controllerScope.loading_goodreads = false;
			}
			
		}).error(function(response) {
			var toast = $mdToast.simple()
                                .textContent("Unable to load ratings from Goodreads")
                                .position('top right');
                    
            $mdToast.show(toast);

			controllerScope.loading_goodreads = false;
		});
	};
}).

service('AuthService', function($q, $http, popupService, GooglePlus, User, USER_ROLES) {
	var LOCAL_TOKEN_KEY = 'local_token_key';
	var LOCAL_USERNAME = 'local_username';
	var LOCAL_USEREMAIL = 'local_useremail';
	var LOCAL_USERPICTURE = 'local_userpicture';
	var LOCAL_USERID = 'local_userid';
	var username = '';
	var useremail = '';
	var userpicture = '';
	var userid = '';
	var isAuthenticated = false;
	var role = '';
	var authToken;

	function loadUserCredentials() {
		var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
		var name = window.localStorage.getItem(LOCAL_USERNAME);
		var email = window.localStorage.getItem(LOCAL_USEREMAIL);
		var picture = window.localStorage.getItem(LOCAL_USERPICTURE);
		var id = window.localStorage.getItem(LOCAL_USERID);
		if (token) {
			useCredentials(token, name, email, picture, id);
		}
	}

	function storeUserCredentials(token, name, email, picture, id) {
		window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
		window.localStorage.setItem(LOCAL_USERNAME, name);
		window.localStorage.setItem(LOCAL_USEREMAIL, email);
		window.localStorage.setItem(LOCAL_USERPICTURE, picture);
		window.localStorage.setItem(LOCAL_USERID, id);
		useCredentials(token, name, email, picture, id);
	}

	function useCredentials(token, name, email, picture, id) {
		username = name;
		useremail = email;
		userpicture = picture;
		userid = id;
		isAuthenticated = true;
		authToken = token;
		role = USER_ROLES.logged_in_user;

		// Set the token as header for your requests!
		$http.defaults.headers.common['X-Auth-Token'] = token;
	}

	function destroyUserCredentials() {
		authToken = undefined;
		username = '';
		email = '';
		userpicture = '';
		userid = '';
		isAuthenticated = false;
		$http.defaults.headers.common['X-Auth-Token'] = undefined;
		window.localStorage.removeItem(LOCAL_TOKEN_KEY);
		window.localStorage.removeItem(LOCAL_USERNAME);
		window.localStorage.removeItem(LOCAL_USEREMAIL);
		window.localStorage.removeItem(LOCAL_USERPICTURE);
		window.localStorage.removeItem(LOCAL_USERID);
	}

	var login = function() {
		return $q(function(resolve, reject) {

		    GooglePlus.login().then(function (authResult) {

		        GooglePlus.getUser().then(function (user) {
		        	if (user.email.endsWith("@realimpactanalytics.com")) {
			            storeUserCredentials(authResult.token, user.name, user.email, user.picture, user.id);
			            createUserInDB(user.name, user.email, user.picture, user.id);
			    		resolve({
			    			message: 'Login and username success.',
			    			name: user.name,
			    			email: user.email,
			    			picture: user.picture,
			    			id: user.id
			    		});
			    	} else {
			    		GooglePlus.logout();
			    		popupService.showPopup('Please login with your @realimpactanalytics.com account!');
			    	}
		        }, function (err) {
			        console.log(err);
			    	reject('Username request failed.');
			    });

		    }, function (err) {
		        console.log(err);
		    	reject('Login failed.');
		    });
		});
	};

	var logout = function() {
		GooglePlus.logout();
		destroyUserCredentials();
	};

	var isAuthorized = function(authorizedRoles) {
		if (!angular.isArray(authorizedRoles)) {
		  authorizedRoles = [authorizedRoles];
		}
		return (isAuthenticated && authorizedRoles.indexOf(role) !== -1);
	};

	var createUserInDB = function(name, email, picture, id) {
		var existing_user = User.get({google_id:id}, function() {
            if (existing_user.google_id === undefined) {
                var user = new User();
				user.name = name;
				user.email = email;
				user.picture = picture;
				user.google_id = id;
				user.$save();
            } else {
                existing_user.name = name;
                existing_user.email = email;
                existing_user.picture = picture;
                existing_user.$update();
            }
        });
	};

	loadUserCredentials();

	return {
		login: login,
		logout: logout,
		isAuthorized: isAuthorized,
		isAuthenticated: function() {return isAuthenticated;},
		username: function() {return username;},
		useremail: function() {return useremail;},
		userpicture: function() {return userpicture;},
		userid: function() {return userid;},
		role: function() {return role;}
	};
}).

factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
	return {
		responseError: function (response) {
			$rootScope.$broadcast({
				401: AUTH_EVENTS.notAuthenticated,
				403: AUTH_EVENTS.notAuthorized
			}[response.status], response);
			return $q.reject(response);
		}
	};
}).
 
config(function ($httpProvider) {
 	$httpProvider.interceptors.push('AuthInterceptor');
});

