angular.module('CollaborativeBookshelfApp.constants',[]).

constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
}).
 
constant('USER_ROLES', {
  admin: 'admin_role',
  logged_in_user: 'logged_in_user_role'
});