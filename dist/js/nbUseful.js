/* global angular */

(function(angular) {
  angular.module('nbUseful', ['ngStorage']);
})(angular);
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
/* global angular */

(function(angular) {
  angular.module('nbUseful').constant('CACHER_ENGINE', {
    local: 'cacher-engine-local',
    session: 'cacher-engine-session'
  })
  .factory('$cacher', ['$interval', 'CACHER_ENGINE', '$localStorage', '$sessionStorage', function($interval, CACHER_ENGINE, ls, ss) {
    var instances = {},
    storageEngine = ss,
    storageEngineName = CACHER_ENGINE.session;

    var cacheRequest = function(uniqueId, opt) {
      var id = uniqueId,
      storageKey = 'cacheRequestData_' + id,
      sourceData = {
        _1: null,
        _2: null
      },
      timer, 
      options = angular.extend({
        interval: 30,
        engine: storageEngineName
      }, opt),
      engine = options.engine == CACHER_ENGINE.local ? ls : ss,
      lastUpdate = engine.cacheRequestLastUpdate;

      if (!lastUpdate) {
        lastUpdate = new Date();
        engine.cacheRequestLastUpdate = lastUpdate;
      } else {
        lastUpdate = new Date(lastUpdate);
      }

      this.source = function(_1, _2, _3) {
        sourceData = {
          _1: _1,
          _2: _2,
          _3: _3
        };
      };

      this.start = function(int) {
        this.load();
        $interval(function() {
          this.load();
        }.bind(this), int || options.interval);
      };

      this.stop = function() {
        $interval.cancel(timer);
      };

      this.storage = function(data) {
        if (data != undefined) {
          if (data !== null) {
            engine[storageKey] = data;
            lastUpdate = new Date();
            engine.cacheRequestLastUpdate = lastUpdate;
          } else {
            this.clearStorage();
          }
        } else {
          return engine[storageKey];
        }
      };

      var _1storage = function(data) {
        if (data != undefined) {
          this.storage(data);

          if (typeof sourceData._3 == 'function') {
            sourceData._3.apply(null);
          }
        } else {
          return this.storage();
        }
      }.bind(this);

      this.clearStorage = function() {
        delete engine[storageKey];
        lastUpdate = new Date();
        engine.cacheRequestLastUpdate = lastUpdate;
      };

      this.reload = function() {
        var args = [_1storage];

        angular.forEach(arguments, function(arg) {
          args.push(arg);
        });

        sourceData._1.apply(null, args);
      };

      this.load = function() {
        var now = new Date(),
        diff = Math.ceil(Math.abs(now.getTime() - lastUpdate.getTime()) / 1000),
        storageData = this.storage(),
        args = [];

        if (diff < options.interval && storageData) {
          args.push(storageData);
        } else {
          args.push(_1storage);
        }

        angular.forEach(arguments, function(arg) {
          args.push(arg);
        });

        if (diff < options.interval && storageData) {
          if (typeof sourceData._2 == 'function') {
            sourceData._2.apply(null, args);

            if (typeof sourceData._3 == 'function') {
              sourceData._3.apply(null);
            }
          }
        } else {
          if (typeof sourceData._1 == 'function') {
            sourceData._1.apply(null, args);
          }
        }
      };

      this.refresh = function() {
        this.load(arguments);
      };

      this.destroy = function() {
        if (engine[uniqueId] > -1) {
          this.stop();
          delete engine[storageKey];
          delete engine[uniqueId];
        }
      };
    };

    return {
      changeEngine: function(engine) {
        if (engine == CACHER_ENGINE.local) {
          storageEngine = ls;
          storageEngineName = CACHER_ENGINE.local;
        } else {
          storageEngine = ss;
          storageEngineName = CACHER_ENGINE.session;
        }
      },
      get: function(uniqueId) {
        var instance = null;
        if (instances[uniqueId] != undefined) {
          instance = instances[uniqueId];
        }

        return instance;
      },
      exists: function(uniqueId) {
        return this.get(uniqueId) != false;
      },
      init: function(uniqueId, options) {
        if (uniqueId == undefined || uniqueId == '') {
          throw 'Unique id must be provided!';
        }

        var instance = this.get(uniqueId);

        if (!instance) {
          instance = new cacheRequest(uniqueId, options);
          instances[uniqueId] = instance;
        }

        return instance;
      },
      remove: function(uniqueId) {
        var instance = this.get(uniqueId);

        if (!instance) {
          instance[uniqueId].destroy();
        }
      },
      removeAll: function() {
        angular.forEach(instances, function(instance, id) {
          instances[id].destroy();
        });
        instances = {};
      },
      storage: {
        set: function(key, value) {
          storageEngine[key] = value;
        },
        get: function(key) {
          return storageEngine[key];
        },
        remove: function(key) {
          delete storageEngine[key];
        }
      }
    };
  }]);
})(angular);
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
/* global angular */

(function(angular) {
  angular.module('nbUseful').factory('$popup', ['$timeout', function($timeout) {
    var popup = {
      backdrop: function(opt) {
        var backdrop = function(opt) {
          var options = angular.extend({
            cssClass: '',
            scroll: false,
            clickClose: true
          }, opt || {}),
          visible = false,
          b = angular.element('body'),
          element = {
            root: angular.element('<div></div>').addClass('popup-overlay fade')
          };

          element.root.hide();
          element.root.addClass(typeof options.cssClass == 'string' ? options.cssClass : options.cssClass.join(' '));

          if (options.clickClose) {
            element.root.click(function(e) {
              e.preventDefault();
              this.hide();
            }.bind(this));
          }

          this.show = function() {
            visible = true;

            element.root.appendTo(b);

            if (!options.scroll) {
              b.addClass('popup-open');
            }

            element.root.show().addClass('in');
          };

          this.hide = function(destroy) {
            visible = false;

            b.removeClass('popup-open');
            element.root.removeClass('in');

            $timeout(function() {
              element.root.detach();
            }, 200);

            if (destroy === true) {
              delete this;
            }
          };

          this.isVisible = function() {
            return visible;
          };

          this.elements = function() {
            return element;
          };

          this.destroy =  function() {
            this.hide(true);
          };
        };

        return new backdrop(opt);
      },
      loader: function(opt) {
        var loader = function(opt) {
          var options = angular.extend({
            message: '',
            backdrop: {},
            cssClass: ''
          }, opt || {}),
          visible = false,
          backdrop = null,
          w = angular.element(window),
          reposition = function() {
            if (visible) {
              element.dialog.css({
                marginTop: (w.height() / 2) - (element.dialog.height() / 2)
              });
            }
          },
          updateMessage = function(message) {
            if (message != '') {
              element.message.html(message).removeClass('ng-hide');
            } else {
              element.message.addClass('ng-hide').html('');
            }
          },
          element = {
            root: angular.element('<div></div>').addClass('popup-loader fade')
          };
          element.dialog = angular.element('<div></div>').addClass('popup-loader-dialog').appendTo(element.root);
          element.animation = angular.element('<div></div>').addClass('animation').appendTo(element.dialog);
          element.message = angular.element('<div></div>').addClass('message').appendTo(element.dialog);

          element.root.hide();
          element.root.addClass(typeof options.cssClass == 'string' ? options.cssClass : options.cssClass.join(' '));

          if (options.backdrop !== false) {
            backdrop = popup.backdrop(angular.extend(options.backdrop, {clickClose: false}));
          }

          w.resize(reposition);

          this.message = function(message) {
            if (message != undefined) {
              updateMessage(message);
              return this;
            } else {
              updateMessage(options.message);
              return element.message.html();
            }
          };

          this.show = function(message) {
            visible = true;

            if (backdrop) {
              backdrop.show();
            }

            element.root.appendTo('body');

            this.message(message);

            element.root.show().addClass('in');

            reposition();

            return this;
          };

          this.hide = function(destroy) {
            visible = false;

            if (backdrop) {
              backdrop.hide(destroy);
            }

            element.root.removeClass('in');

            $timeout(function() {
              element.root.detach();
            }, 200);

            if (destroy === true) {
              delete this;
            }

            return this;
          };

          this.isVisible = function() {
            return visible;
          };

          this.elements = function() {
            return element;
          };

          this.destroy =  function() {
            this.hide(true);
          };
        };

        return new loader(opt);
      },
      modal: function(opt) {
        var modal = function(opt) {
          var options = angular.extend({
            title: '',
            template: '',
            close: 'Zamknij',
            backdrop: {},
            cssClass: '',
            backdropClose: true,
            delay: 0
          }, opt || {}),
          visible = false,
          backdrop = null,
          w = angular.element(window),
          timeout = null,
          reposition = function(r) {
            if (visible) {
              if (r == undefined || r !== false) {
                refresh();
              }
              var inDiff = (element.root.outerHeight(true) - element.root.height()) / 2,
              marginTop = (w.height() / 2) - (element.dialog.outerHeight(true) / 2) - inDiff;
              if (marginTop < 0) {
                marginTop = 0;
              }
              element.dialog.css({
                marginTop: marginTop
              });
            }
          },
          refresh = function() {
            var wH = w.height(),
            mH = element.dialog.outerHeight(true);

            element.dialog.removeClass('loading');

            if (mH > wH) {
              var h = wH;
              h -= (element.root.outerHeight(true) - element.root.height());
              h -= parseFloat(element.dialog.css('padding-top'));
              h -= parseFloat(element.dialog.css('padding-bottom'));
              h -= element.header.outerHeight(true);
              h -= (element.template.outerHeight(true) - element.template.height());
              h -= element.buttons.outerHeight(true);

              element.template.addClass('scroll').height(h);
            } else {
              element.template.removeClass('scroll').height('auto');
            }

            reposition(false);
          },
          element = {
            root: angular.element('<div></div>').addClass('popup-modal fade')
          };
          element.dialog = angular.element('<div></div>').addClass('popup-modal-dialog').appendTo(element.root);
          element.header = angular.element('<div></div>').addClass('header clearfix').appendTo(element.dialog);
          element.title = angular.element('<div></div>').addClass('title').appendTo(element.header);
          element.close = angular.element('<a href="#"><i class="glyphicon glyphicon-remove"></i></a>').addClass('close').appendTo(element.header);
          element.template = angular.element('<div></div>').addClass('content').appendTo(element.dialog);
          element.buttons = angular.element('<div></div>').addClass('buttons').appendTo(element.dialog);

          element.root.hide();

          element.root.addClass(typeof options.cssClass == 'string' ? options.cssClass : options.cssClass.join(' '));
          element.close.attr('title', options.close);

          if (options.backdrop !== false) {
            backdrop = popup.backdrop(angular.extend(options.backdrop, {clickClose: false}));
          }

          if (options.backdrop !== false && options.backdropClose) {
            element.root.click(function(e) {
              if (e.target == element.root[0]) {
                this.hide();
              }
            }.bind(this));
          }

          element.close.click(function(e) {
            e.preventDefault();
            this.hide();
          }.bind(this));

          w.resize(reposition);

          this.title = function(text) {
            if (text != undefined) {
              if (text != '') {
                element.title.html(text);
              } else {
                element.title.html('&nbsp;');
              }
              return this;
            } else {
              return element.title.html();
            }
          };

          this.template = function(template) {
            if (template != undefined) {
              if (template === true) {
                return element.template.contents();
              } else {
                if (typeof template == 'string') {
                  element.template.html(template);
                } else if (typeof template == 'function') {
                  if (visible) {
                    element.dialog.addClass('loading');
                    template.call(this, element.template, refresh);
                  }
                } else if (typeof template == 'object') {
                  element.template.contents().remove();
                  template.appendTo(element.template);
                }

                return this;
              }
            } else {
              return element.template.html();
            }
          };

          this.buttons = function(buttons) {
            element.buttons.children().remove();

            if (buttons != undefined) {
              element.buttons.removeClass('ng-hide');
              angular.forEach(buttons, function(button, label) {
                var btn = angular.element('<button></button>').text(label).addClass('btn btn-default btn-sm').appendTo(element.buttons);
                btn.click(function(e) {
                  e.preventDefault();
                  button.call(this, btn);
                }.bind(this));
                if (options.button && typeof options.button == 'function') {
                  options.button.call(this, btn, label);
                }
              }.bind(this));
            } else {
              element.buttons.addClass('ng-hide');
            }

            return this;
          };

          this.show = function() {
            visible = true;

            element.root.appendTo('body');

            if (backdrop) {
              backdrop.show();
            }

            var opt = angular.extend({}, options);

            if (arguments.length == 2) {
              this.template(arguments[0]);
              if (typeof arguments[1] == 'string') {
                this.title(arguments[1]);
              } else if (typeof arguments[1] == 'object') {
                opt = angular.extend({}, options, arguments[1] || {});
                this.title(opt.title);
              }
              this.buttons(opt.buttons);
            } else if (arguments.length == 1) {
              if (typeof arguments[0] == 'string') {
                this.template(arguments[0]);
              } else if (typeof arguments[0] == 'object') {
                opt = angular.extend({}, options, arguments[0] || {});
                this.template(opt.template);
              }
              this.title(opt.title);
              this.buttons(opt.buttons);
            } else {
              this.title(opt.title);
              this.template(opt.template);
              this.buttons(opt.buttons);
            }

            element.root.show();

            reposition();

            element.root.addClass('in');

            var bButtons = element.buttons.children();
            if (bButtons.length > 0) {
              bButtons.last().focus();
            } else {
              element.close.focus();
            }

            if (opt.delay > 0) {
              timeout = $timeout(function() {
                $timeout.cancel(timeout);
                this.hide();
              }.bind(this), opt.delay);
            }

            return this;
          };

          this.hide = function(destroy) {
            visible = false;

            if (backdrop) {
              backdrop.hide(destroy);
            }

            element.root.removeClass('in');

            $timeout(function() {
              if (timeout != null) {
                $timeout.cancel(timeout);
              }
              element.root.detach();
            }, 200);

            if (destroy === true) {
              w.unbind('resize', reposition);
              delete this;
            }

            return this;
          };

          this.isVisible = function() {
            return visible;
          };

          this.elements = function() {
            return element;
          };

          this.destroy = function() {
            this.hide(true);
          };
        };

        return new modal(opt);
      },
      dialog: function(opt) {
        if (opt) {
          if (opt.cssClass != undefined) {
            if (typeof opt.cssClass == 'string') {
              opt.cssClass = 'popup-dialog ' + opt.cssClass;
            } else if (typeof opt.cssClass == 'object') {
              opt.cssClass.unshift('popup-dialog'); 
            }
          } else {
            opt.cssClass = 'popup-dialog';
          }
        } else {
          var opt = {
            cssClass: 'popup-dialog'
          };
        }

        return popup.modal(opt);
      },
      zendform: function(opt) {
        var zendform = popup.dialog(opt),
        show = zendform.show;

        zendform.show = function(response) {
          var template = '';

          if (response) {
            if (response.message && response.message != '') {
              template = response.message;
            } else if (angular.isArray(response)) {
              var messages = [];
              angular.forEach(response, function(message) {
                messages.push(message);
              });
              template = messages.join('<br />');
            } else if (response.errors) {
              var messages = [];
              angular.forEach(response.errors, function(fieldErrors) {
                angular.forEach(fieldErrors, function(message) {
                  messages.push(message);
                });
              });
              template = messages.join('<br />');
            }
          }

          show.call(this, template);
        };

        return zendform;
      }
    };

    return popup;
  }]);
})(angular);
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
/* global angular */

(function(angular) {
  angular.module('nbUseful').filter('trusted', ['$sce', function($sce){
    return function(text) {
      return $sce.trustAsHtml(text);
    };
  }]);
})(angular);