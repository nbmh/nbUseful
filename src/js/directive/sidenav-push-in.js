/* global angular */

/**
 * @author Domas Trijonis <domas.trijonis@gmail.com> 
 * @link https://github.com/FDIM
 */

(function(angular) {
  angular.module('nbUseful').directive('sidenavPushIn', function () {
    return {
      restrict: 'A',
      require: '^mdSidenav',
      link: function($scope, element, attr, sidenavCtrl) {
        var body = angular.element(document.body);
        body.addClass('md-sidenav-push-in');
        var cssClass = (element.hasClass('md-sidenav-left') ? 'md-sidenav-left' : 'md-sidenav-right') + '-open';
        var stateChanged = function(state) {
          body[state ? 'addClass' : 'removeClass'](cssClass);
        };
        // overvwrite default functions and forward current state to custom function
        angular.forEach(['open', 'close', 'toggle'], function(fn) {
          var org = sidenavCtrl[fn];
          sidenavCtrl[fn] = function() {
            var res = org.apply(sidenavCtrl, arguments);
            stateChanged(sidenavCtrl.isOpen());
            return res;
          };
        });
      }
    };
  }).directive('sidenavPushInTarget', function () {
    return {
      restrict: 'A',
      link: function($scope, element) {
        element.addClass('md-sidenav-push-in-target');
      }
    };
  });
})(angular);