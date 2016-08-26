/* global angular */

(function(angular) {
  angular.module('nbUseful').directive('collapse', [function() {
    return {
      restrict: 'A',
      link: function($scope, element, attributes) {
        var el = element[0],
        currentHeight = function() {
          return el.offsetHeight;
        },
        autoHeight = function() {
          var height = currentHeight();

          el.style.height = 'auto';
          var autoHeight = currentHeight();

          el.style.height = height + 'px';
          currentHeight();

          return autoHeight;
        };

        $scope.$watch(attributes.collapse, function(collapse) {
          setTimeout(function() {
            var height = collapse ? 0 : autoHeight();
            el.style.height = height + 'px';
            element.toggleClass('collapsed', collapse);
          }, 0);
        });
      }
    };
  }]);
})(angular);