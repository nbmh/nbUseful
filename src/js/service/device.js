/* global angular */

(function(angular) {
  angular.module('nbUseful').factory('$device', [function() {
    return {
      os: function() {
        return (navigator.userAgent.match(/iPad/i))  == 'iPad' ? 'iPad' : (navigator.userAgent.match(/iPhone/i))  == 'iPhone' ? 'iPhone' : (navigator.userAgent.match(/Android/i)) == 'Android' ? 'Android' : (navigator.userAgent.match(/BlackBerry/i)) == 'BlackBerry' ? 'BlackBerry' : 'null';
      }
    };
  }]);
})(angular);