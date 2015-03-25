(function () {
    "use strict";
    var Promise = require("bluebird");
    var hashme = require("hash-me");

    function EventEmitter() {
        if (!(this instanceof EventEmitter)) {
            return new EventEmitter;
        }
        this._events = {};
    }

    module.exports = EventEmitter;

    function Listener(emitter, event, callback) {
        this.emitter = emitter;
        this.event = event;
        this.dependencies = new hashme.Set;
        this.consumers = new hashme.Set;
        this.callback = callback;
    }

    function OnceListener(emitter, event, callback) {
        Listener.call(this, emitter, event, callback);
    }

    function DependencyListener(dependent, emitter, event, callback) {
        Listener.call(this, emitter, event, callback);
        this.dependent = dependent;
    }

    var addEventListener = function (event, listener, dependencies) {
        if (typeof listener !== "function") {
            throw new TypeError("Expected function for event listener.");
        }
        if (!(this._events[event] instanceof hashme.Map)) {
            this._events[event] = new hashme.Map;
        }
        if (!this._events[event].has(listener)
            || this._events[event].get(listener) instanceof OnceListener
            || this._events[event].get(listener) instanceof DependencyListener) {
            this._events[event].set(listener, new Listener(this, event, listener));
        }
        if (isArrayLike(dependencies)) {
            this._events[event].get(listener).mergeDependencies(Array.prototype.slice.call(dependencies, 0));
        }
        return this;
    };
    var removeEventListener = function (event, listener) {
        if (this._events[event] instanceof hashme.Map) {
            if (!this._events[event].has(listener)) {
                return this;
            }
            var wrapper = this._events[event].get(listener);
            wrapper.deleteConsumers();
            wrapper.purgeDependencies();
            this._events[event].delete(listener);
            if (this._events[event].isEmpty()) {
                delete this._events[event];
            }
        }
        return this;
    };
    var removeAllListeners = function (event) {
        if (arguments.length >= 1) {
            delete this._events[event];
        } else {
            this._events = {};
        }
        return this;
    };

    /**
     * Sort all listeners of specified event on emitter object topologically. The result contains array of listener
     * objects. The order in the same level of dependency-resolving is undefined (e.g. if there are two listener that
     * doesn't depend on anything or depend on the same listeners, order of calling is not specified in the
     * documentation of this specification and it could change in future).
     * @param emitter
     * @param event
     * @return {Array}
     */
    var topologicalSort = function (emitter, event) {
        var result = [];
        if (!(emitter._events[event] instanceof hashme.Map)) {
            return result;
        }
        var resolved = new hashme.Set, unresolved = new hashme.Set, listener_resolve = function (listener, wrapper) {
            unresolved.add(listener);
            wrapper.dependencies.forEach(function (listener) {
                resolve_check(listener, emitter._events[event].get(listener));
            });
            resolved.add(listener);
            unresolved.delete(listener);
            result.push(wrapper);
        }, resolve_check = function (listener, wrapper) {
            if (!resolved.has(listener)) {
                if (unresolved.has(listener)) {
                    var err = new ReferenceError("Circular reference detected while resolving listeners order.");
                    err.code = 'CIRCULAR_REFERENCE';
                    throw err;
                }
                listener_resolve(listener, wrapper);
            }
        };
        emitter._events[event].forEach(function (wrapper, listener) {
            resolve_check(listener, wrapper);
        });
        return result;
    };
    /**
     * Topological grouping returns array of arrays of listener objects. The first element of the outer array is array
     * of all listeners that doesn't depend on anything. The second element contains listener that depends on listeners
     * from the first element, the third element contains listeners that depend on first and second elements and so on.
     * This structure can be directly given to Promise.map() which mapper function can call Promise.all on received
     * inner array. The order of listener object in inner arrays is undefined by specification.
     * @param emitter
     * @param event
     */
    var topologicalGroup = function (emitter, event) {
        var result = [];
        if (!(emitter._events[event] instanceof hashme.Map)) {
            return result;
        }
        var previous = emitter._events[event], resolved = new hashme.Set, unresolved, level;
        while (true) {
            if (previous.isEmpty()) {
                break;
            }
            unresolved = new hashme.Map;
            level = [];
            previous.forEach(function (wrapper, listener) {
                if (wrapper.dependencies.every(function (dependency) {
                        return resolved.has(dependency)
                    })) {
                    resolved.add(listener);
                    level.push(wrapper);
                } else {
                    unresolved.set(listener, wrapper);
                }
            });
            if (level.length === 0) {
                var err = new ReferenceError("Circular reference detected while resolving listeners order.");
                err.code = 'CIRCULAR_REFERENCE';
                throw err;
            }
            result.push(level);
            previous = unresolved;
        }
        return result;
    };
    var emitSeries = Promise.method(function (event) {
        var args = Array.prototype.slice.call(arguments, 1), self = this;
        var listeners = topologicalSort(self, event);
        var result = new hashme.Map;
        return Promise.each(listeners, function (listener) {
            return listener.call(self, args).then(function (value) {
                result.set(listener, value);
            });
        }).return(result);
    });
    var emitParallel = Promise.method(function (event) {
        var args = Array.prototype.slice.call(arguments, 1), self = this;
        var levels = topologicalGroup(self, event);
        var result = new hashme.Map;
        return Promise.map(levels, function (level) {
            return Promise.map(level, function (listener) {
                return listener.call(self, args).then(function (value) {
                    result.set(listener, value);
                });
            })
        }).return(result);
    });

    EventEmitter.prototype = Object.create(Object.prototype, {
        constructor: {
            value: EventEmitter
        },
        addListener: {
            value: addEventListener
        },
        addEventListener: {
            value: addEventListener
        },
        on: {
            value: addEventListener
        },
        once: {
            value: function (event, listener, dependencies) {
                if (typeof listener !== "function") {
                    throw new TypeError("Expected function for event listener.");
                }
                if (!(this._events[event] instanceof hashme.Map)) {
                    this._events[event] = new hashme.Map;
                }
                if (!this._events[event].has(listener)
                    || this._events[event].get(listener) instanceof DependencyListener) {
                    this._events[event].set(listener, new OnceListener(this, event, listener));
                }
                if (isArrayLike(dependencies)) {
                    this._events[event].get(listener).mergeDependencies(Array.prototype.slice.call(dependencies, 0));
                }
                return this;
            }
        },
        removeListener: {
            value: removeEventListener
        },
        removeEventListener: {
            value: removeEventListener
        },
        off: {
            value: removeEventListener
        },
        removeAllListeners: {
            value: removeAllListeners
        },
        hasListener: {
            value: function (event, listener) {
                if (arguments.length >= 2) {
                    if (!(this._events[event] instanceof hashme.Map)) {
                        return false;
                    }
                    return this._events[event].has(listener);
                } else if (arguments.length >= 1) {
                    return this._events[event] instanceof hashme.Map;
                }
                return Object.getOwnPropertyNames(this._events).length > 0;
            }
        },
        getSortedListenerList: {
            value: function (event) {
                return topologicalSort(this, event).map(function (wrapper) {
                    return wrapper.callback;
                });
            }
        },
        getGroupedListenerList: {
            value: function (event) {
                return topologicalGroup(this, event).map(function (level) {
                    return level.map(function (wrapper) {
                        return wrapper.callback;
                    });
                });
            }
        },
        getListenerDependencyList: {
            value: function (event, listener) {
                if (!(this._events[event] instanceof hashme.Map)) {
                    return [];
                }
                if (!this._events[event].has(listener)) {
                    return [];
                }
                var wrapper = this._events[event].get(listener);
                return wrapper.dependencies.values();
            }
        },
        emit: {
            value: emitParallel
        },
        emitSeries: {
            value: emitSeries
        }
    });
    Listener.prototype = Object.create(Object.prototype, {
        constructor: {
            value: Listener
        },
        call: {
            value: function (thisArg, argArray) {
                return Promise.method(this.callback).apply(thisArg, argArray);
            }
        },
        mergeDependencies: {
            value: function (dependencies) {
                //if(!(this.emitter.hasListener(this.event, this.callback))) {
                //    return;
                //}
                dependencies.forEach(function (dependency) {
                    if (typeof dependency !== "function") {
                        throw new TypeError("Dependency is not a function");
                    }
                    if (dependency === this.callback) {
                        throw new ReferenceError("Cannot add dependency on self");
                    }
                    if (this.dependencies.has(dependency)) {
                        return;
                    }
                    //if (!(this.emitter._events[this.event] instanceof hashme.Map)) {
                    //    this.emitter._events[this.event] = new hashme.Map;
                    //}
                    if (!this.emitter._events[this.event].has(dependency)) {
                        this.emitter._events[this.event].set(dependency,
                            new DependencyListener(this, this.emitter, this.event, dependency));
                    }
                    var dependencyWrapper = this.emitter._events[this.event].get(dependency);
                    dependencyWrapper.consumers.add(this.callback);
                    this.dependencies.add(dependency);
                }, this);
            }
        },
        deleteConsumers: {
            value: function () {
                this.consumers.forEach(function (consumer) {
                    this.emitter._events[this.event].get(consumer).dependencies.delete(this.callback);
                }, this);
                this.consumers.clear();
            }
        },
        purgeDependencies: {
            value: function () {
                this.dependencies.forEach(function (dependency) {
                    var wrapper = this.emitter._events[this.event].get(dependency);
                    wrapper.consumers.delete(this.callback);
                    if (wrapper instanceof DependencyListener && wrapper.consumers.isEmpty()) {
                        this.emitter.removeListener(this.event, dependency);
                    }
                }, this);
            }
        }
    });
    OnceListener.prototype = Object.create(Listener.prototype, {
        constructor: {
            value: OnceListener
        },
        call: {
            value: function (thisArg, argArray) {
                var self = this;
                return Listener.prototype.call.call(this, thisArg, argArray).finally(function () {
                    self.emitter.removeListener(self.event, self.callback);
                });
            }
        }
    });
    DependencyListener.prototype = Object.create(Listener.prototype, {
        constructor: {
            value: DependencyListener
        },
        call: {
            value: function (thisArg, argArray) {
                var self = this;
                return Listener.prototype.call.call(this, thisArg, argArray);
            }
        }
    });
    var isArrayLike = function (arr) {
        //If it is an array, then it is array like (works from other contexts).
        if (Array.isArray(arr)) {
            return true;
        }
        //If not an array it must be "object", but not function (functions have non-negative number for length, too).
        if (typeof arr !== "object") {
            return false;
        }
        //It must have length property in it (or in its prototype chain).
        if (!("length" in arr)) {
            return false;
        }
        //That property must be number (not numeric string or etc).
        if (typeof arr.length !== "number") {
            return false;
        }
        //That number must be finite (not NaN or Infinity).
        if (!isFinite(arr.length)) {
            return false;
        }
        //That number must be integer (not something like 3.4).
        if (arr.length !== parseInt(arr.length)) {
            return false;
        }
        //The numbers in array must be 32-bit integer
        //(although no standard limitation, we don't want to work with larger arrays);
        //V8 really act strangely if property 4294967295 (32-bit signed -1) is defined, but result is as if property is
        // not there. V8 doesn't affect the "length" property assigning 4294967295 or greater index.
        if (arr.length < 0 || arr.length >= 4294967295) {
            return false;
        }
        //To guarantee clean array, one should call Array.prototype.slice.call(arr, 0), result a copy of array-like:
        //1. The copy is direct instance of Array (no mid-prototypes, not an array-like object).
        //2. The copy is in the same context as the "slice" caller.
        //3. The copy contains only numeric properties in 32-bit range and the length, no auxiliary values are copied.
        //4. The copy is a shallow copy.
        return arr;
    };
})();