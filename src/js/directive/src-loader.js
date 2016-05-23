/* global angular */

(function(angular) {
  angular.module('nbUseful').directive('srcLoader', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var img, loadImage, 
        wrapper = angular.element('<div></div>').addClass('src-loader').insertBefore(element);
        element.appendTo(wrapper);

        loadImage = function () {
          wrapper.addClass('src-loading').removeClass('src-loaded');
          img = new Image();
          img.onload = function () {
            element[0].src = attrs.nbSrcLoader;
            wrapper.addClass('src-loaded').removeClass('src-loading');
          };
          img.src = attrs.nbSrcLoader;
        };

        if (attrs.nbSrcLoader != '') {
          loadImage();
        } else {
          wrapper.addClass('src-empty');
        }

        scope.$watch((function () {
          return attrs.nbSrcLoader;
        }), function (newVal, oldVal) {
          if (oldVal !== newVal) {
            loadImage();
          }
        });
      }
    };
  });
})(angular);