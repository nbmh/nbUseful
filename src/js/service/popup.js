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