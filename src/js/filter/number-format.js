/* global angular */

(function(angular) {
  angular.module('nbUseful').filter('numberFormat', function() {
    return function(input, decimals, decSeparator, thSeparator) {

      input = parseFloat(input);

      if (isNaN(input)) {
        return '';
      }

      var _decimals = decimals || 2,
      _decSeparator = decSeparator || '.',
      _thSeparator = thSeparator || '',
      numInt = Math.floor(input),
      numDec = (input % 1).toFixed(2),
      dec = Math.floor(numDec * Math.pow(10, _decimals)),
      reverse = (numInt + '').split('').reverse(),
      result = [],
      j = 1;

      for (var i = 0; i < reverse.length; i++) {
        result.push(reverse[i]);
        j++;
        if (j > 3) {
          result.push(_thSeparator);
          j = 1;
        }
      }

      return result.reverse().join('') + (_decimals > 0 ? _decSeparator + dec : '');
    };
  });
})(angular);