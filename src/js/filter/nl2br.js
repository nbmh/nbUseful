/* global angular */

(function(angular) {
  angular.module('nbUseful').filter('nl2br', function() {
    return function(input) {
      if (typeof input == 'string') {
        return input.replace(/\n/g, '<br />');
      } else {
        return input;
      }
    };
  });
})(angular);