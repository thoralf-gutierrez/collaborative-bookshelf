
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

service('Recommendations',function(){
	
    this.is_recommended = function(book, user) {
    	var recommended = false;
        book.recommended_by.map( function(object, i) {
            if (object._id == user.id)
                recommended = true;
        });
        return recommended;
    };

    this.toggle_recommend = function(book, user) {
        var index = -1;
        book.recommended_by.map( function(object, i) {
            if (object._id == user.id)
                index = i;
        });
        if (index >= 0) {
            book.recommended_by.splice(index, 1); 
            book.$update( function() { book.is_recommended = false; });
        } else {
            book.recommended_by.push( { _id: user.id } );
            book.$update( function() { book.is_recommended = true; });
        }
        
    };

}).

service('Votes',function(){
	
    this.is_voted = function(book, user) {
    	var voted = false;
        book.voted_by.map( function(object, i) {
            if (object._id == user.id)
                voted = true;
        });
        return voted;
    };

    this.toggle_vote = function(book, user) {
        var index = -1;
        book.voted_by.map( function(object, i) {
            if (object._id == user.id)
                index = i;
        });
        if (index >= 0) {
            book.voted_by.splice(index, 1); 
            book.$update( function() { book.is_voted = false; });
        } else {
            book.voted_by.push( { _id: user.id } );
            book.$update( function() { book.is_voted = true; });
        }
        
    };

}).

service('AuthService', function($q, $http, popupService, GooglePlus, User, USER_ROLES) {
	var LOCAL_TOKEN_KEY = 'local_token_key';
	var LOCAL_USER_ID = 'local_user_id';
	var LOCAL_USER_NAME = 'local_user_name';
	var LOCAL_USER_EMAIL = 'local_user_email';
	var LOCAL_USER_PICTURE = 'local_user_picture';
	var LOCAL_USER_GOOGLE_ID = 'local_user_google_id';
	var user_id = '';
	var user_name = '';
	var user_email = '';
	var user_picture = '';
	var user_google_id = '';
	var isAuthenticated = false;
	var role = '';
	var authToken;

	function loadUserCredentials() {
		var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
		var id = window.localStorage.getItem(LOCAL_USER_ID);
		var name = window.localStorage.getItem(LOCAL_USER_NAME);
		var email = window.localStorage.getItem(LOCAL_USER_EMAIL);
		var picture = window.localStorage.getItem(LOCAL_USER_PICTURE);
		var google_id = window.localStorage.getItem(LOCAL_USER_GOOGLE_ID);
		if (token && id.length > 0) {
			useCredentials(token, id, name, email, picture, google_id);
		}
	}

	function storeUserCredentials(token, id, name, email, picture, google_id) {
		window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
		window.localStorage.setItem(LOCAL_USER_ID, id);
		window.localStorage.setItem(LOCAL_USER_NAME, name);
		window.localStorage.setItem(LOCAL_USER_EMAIL, email);
		window.localStorage.setItem(LOCAL_USER_PICTURE, picture);
		window.localStorage.setItem(LOCAL_USER_GOOGLE_ID, google_id);
		useCredentials(token, id, name, email, picture, google_id);
	}

	function useCredentials(token, id, name, email, picture, google_id) {
		user_id = id;
		user_name = name;
		user_email = email;
		user_picture = picture;
		user_google_id = google_id;
		isAuthenticated = true;
		authToken = token;
		role = USER_ROLES.logged_in_user;

		// Set the token as header for your requests!
		$http.defaults.headers.common['X-Auth-Token'] = token;
	}

	function destroyUserCredentials() {
		authToken = undefined;
		user_id = '';
		user_name = '';
		user_email = '';
		user_picture = '';
		user_google_id = '';
		isAuthenticated = false;
		$http.defaults.headers.common['X-Auth-Token'] = undefined;
		window.localStorage.removeItem(LOCAL_TOKEN_KEY);
		window.localStorage.removeItem(LOCAL_USER_ID);
		window.localStorage.removeItem(LOCAL_USER_NAME);
		window.localStorage.removeItem(LOCAL_USER_EMAIL);
		window.localStorage.removeItem(LOCAL_USER_PICTURE);
		window.localStorage.removeItem(LOCAL_USER_GOOGLE_ID);
	}

	var login = function() {
		return $q(function(resolve, reject) {

		    GooglePlus.login().then(function (authResult) {

		        GooglePlus.getUser().then(function (user) {
		        	if (user.email.endsWith("@realimpactanalytics.com")) {

		        		// Create user in db if it does not exist
		        		var existing_user = User.get({google_id:user.id}, function() {
				            if (existing_user.google_id === undefined) {
				                var newuser = new User();
								newuser.name = user.name;
								newuser.email = user.email;
								newuser.picture = user.picture;
								newuser.google_id = user.id;
								newuser.$save( function(createduser) {
									
									storeUserCredentials(
										authResult.token,
										createduser._id,
										createduser.name,
										createduser.email,
										createduser.picture,
										createduser.google_id);
									
									resolve({
						    			message: 'Login and username success.',
						    			id: createduser._id,
						    			name: createduser.name,
						    			email: createduser.email,
						    			picture: createduser.picture,
						    			google_id: createduser.google_id
						    		});

								});
				            } else {
				                existing_user.name = user.name;
				                existing_user.email = user.email;
				                existing_user.picture = user.picture;
				                existing_user.$update( function() {

				                	storeUserCredentials(
										authResult.token,
										existing_user._id,
										existing_user.name,
										existing_user.email,
										existing_user.picture,
										existing_user.google_id);
											
									resolve({
						    			message: 'Login and username success.',
						    			id: existing_user._id,
						    			name: existing_user.name,
						    			email: existing_user.email,
						    			picture: existing_user.picture,
						    			google_id: existing_user.google_id
						    		});

				                });

				               
				            }
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

	loadUserCredentials();

	return {
		login: login,
		logout: logout,
		isAuthorized: isAuthorized,
		isAuthenticated: function() {return isAuthenticated;},
		user_id: function() {return user_id;},
		user_name: function() {return user_name;},
		user_email: function() {return user_email;},
		user_picture: function() {return user_picture;},
		user_google_id: function() {return user_google_id;},
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

