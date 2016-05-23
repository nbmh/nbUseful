/* global angular */

(function(angular) {
  angular.module('nbUseful').filter('trusted', ['$sce', function($sce){
    return function(text) {
      return $sce.trustAsHtml(text);
    };
  }]);
})(angular);