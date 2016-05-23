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