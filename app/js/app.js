
var app = angular.module('CollaborativeBookshelfApp',['ui.router','ngMaterial','ngMdIcons','ngResource', 'ngSanitize', 'googleplus', 'angularMoment',
  'CollaborativeBookshelfApp.controllers',
  'CollaborativeBookshelfApp.constants',
  'CollaborativeBookshelfApp.filters',
  'CollaborativeBookshelfApp.directives',
  'CollaborativeBookshelfApp.services']);

app.config(function($stateProvider,$httpProvider, $urlRouterProvider, USER_ROLES){
    
    $stateProvider.

    state('login',{
        url:'/login',
        templateUrl:'partials/login.html',
        controller:'LoginController'
    }).

    state('books',{
        url:'/books',
        templateUrl:'partials/books.html',
        controller:'BookListController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    }).

    state('viewBook',{
       url:'/books/:id/view',
       templateUrl:'partials/book-view.html',
       controller:'BookViewController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    }).

    state('newBook',{
        url:'/books/new',
        templateUrl:'partials/book-add.html',
        controller:'BookCreateController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    }).

    state('editBook',{
        url:'/books/:id/edit',
        templateUrl:'partials/book-edit.html',
        controller:'BookEditController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    }).

    state('voting',{
        url:'/voting',
        templateUrl:'partials/voting.html',
        controller:'VotingController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    }).

    state('viewVotingBook',{
       url:'/voting/:id/view',
       templateUrl:'partials/voting-book-view.html',
       controller:'VotingBookViewController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    }).

    state('newVotingBook',{
        url:'/voting/new',
        templateUrl:'partials/voting-book-add.html',
        controller:'VotingBookCreateController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    }).

    state('editVotingBook',{
        url:'/voting/:id/edit',
        templateUrl:'partials/voting-book-edit.html',
        controller:'VotingBookEditController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    }).

    state('activity',{
        url:'/activity',
        templateUrl:'partials/activity.html',
        controller:'ActivityController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    }).

    state('users',{
        url:'/users',
        templateUrl:'partials/users.html',
        controller:'UserListController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    }).

    state('viewUser',{
       url:'/users/:id/view',
       templateUrl:'partials/user-view.html',
       controller:'UserViewController',
        data: {
          authorizedRoles: [USER_ROLES.logged_in_user]
        }
    });

    $urlRouterProvider.otherwise(function ($injector, $location) {
      var $state = $injector.get("$state");
      $state.go("books");
    });
});

app.config(function($mdThemingProvider) {
  var customBlueMap = $mdThemingProvider.extendPalette('light-blue', {
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50'],
    '50': 'ffffff'
  });
  $mdThemingProvider.definePalette('customBlue', customBlueMap);
  $mdThemingProvider.theme('default')
    .primaryPalette('customBlue', {
      'default': '500',
      'hue-1': '50'
    })
    .accentPalette('pink');
  $mdThemingProvider.theme('input', 'default')
        .primaryPalette('grey');
});

app.config(['GooglePlusProvider', function(GooglePlusProvider) {
     GooglePlusProvider.init({
        clientId: '179528034765-3mpnu5bsuth169m15a03lua3aqe05hhr.apps.googleusercontent.com',
        apiKey: 'AIzaSyAPlPwE2qah_8C3XMnFIPtjFmKKXwEpgSg'
     });
     GooglePlusProvider.setScopes('email');
}]);

app.run(function ($rootScope, $state, AuthService, AUTH_EVENTS) {
  $rootScope.$on('$stateChangeStart', function (event,next, nextParams, fromState) {
    
    if (!AuthService.isAuthenticated() && next.name !== 'login') {
        event.preventDefault();
        $state.go('login');
    } else if ('data' in next && 'authorizedRoles' in next.data) {
      var authorizedRoles = next.data.authorizedRoles;
      if (!AuthService.isAuthorized(authorizedRoles)) {
        event.preventDefault();
        $state.go($state.current, {}, {reload: true});
        $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
      }
    }

  });
});
