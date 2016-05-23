/* global angular */

(function(angular) {
  angular.module('nbUseful').constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized',
    loginRequest: 'auth-login-request'
  })
  .constant('ACCOUNT_ROLES', {
    all: '*',
    admin: 'admin',
    user: 'user',
    guest: 'guest'
  })
  .service('$authDefaults', function() {
    this.url = {
      login: '',
      logout: '',
      register: ''
    };
    this.session = {
      duration: 3600 * 12
    };
  })
  .factory('$authService', [
    '$http', 
    '$rootScope', 
    '$authDefaults', 
    'AUTH_EVENTS', 
    'AuthAccount',
    '$localStorage',
  function($http, $rootScope, $authDefaults, AUTH_EVENTS, AuthAccount, $storage) {
    var authService = {};

    authService.data = function() {
      return AuthAccount.data();
    };

    authService.updateExpiration = function() {
      $storage.authExpirationDate = new Date();
    };

    authService.checkExpiration = function() {
      if ($storage['authExpirationDate'] != undefined) {
        if (authService.isAuthenticated()) {
          var expiration = new Date($storage.authExpirationDate),
          now = new Date();
          if ((now.getTime() - expiration.getTime()) / 1000 >= $authDefaults.session.duration) {
            authService.logout();
            $rootScope.$broadcast(AUTH_EVENTS.sessionTimeout);
          }
        }
      }

      authService.updateExpiration();
    };

    authService.login = function(credentials) {
      return $http
          .post($authDefaults.url.login, credentials)
          .then(function(response) {
            if (response.data.success) {
              AuthAccount.data(response.data.account);
              $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, response.data.account, credentials);
            }
            return response.data;
          }, function(e) {
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
          });
    };

    authService.register = function(account) {
      return $http
          .post($authDefaults.url.register, account)
          .then(function(response) {
            if (response.data.success) {
              AuthAccount.data(response.data.account);
              $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, response.data.account, account);
            }
            return response.data;
          }, function() {
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
          });
    };

    authService.logout = function() {
      return $http
          .post($authDefaults.url.logout)
          .then(function() {
            AuthAccount.destroy();
            $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
          });
    };

    authService.isAuthenticated = function() {
      return !!AuthAccount.data().id;
    };

    authService.isAuthorized = function(authorizedRoles) {
      if (!angular.isArray(authorizedRoles)) {
        authorizedRoles = [authorizedRoles];
      }
      return (authService.isAuthenticated() && authorizedRoles.indexOf(AuthAccount.data().role) !== -1);
    };

    return authService;
  }])
  .service('AuthAccount', ['$sessionStorage', function($storage) {
    this.data = function(data) {
      if (data) {
        $storage.authData = data;
      }
      return $storage['authData'] != undefined && $storage.authData != '' ? $storage.authData : {};
    };

    this.destroy = function() {
      $storage.authData = {};
    };
  }])
  .factory('AuthInterceptor', ['$rootScope', '$q', 'AUTH_EVENTS', function($rootScope, $q, AUTH_EVENTS) {
    return {
      responseError: function(response) {
        $rootScope.$broadcast({
          401: AUTH_EVENTS.notAuthenticated,
          403: AUTH_EVENTS.notAuthorized,
          419: AUTH_EVENTS.sessionTimeout,
          440: AUTH_EVENTS.sessionTimeout
        }[response.status], response);
        return $q.reject(response);
      }
    };
  }]);
})(angular);