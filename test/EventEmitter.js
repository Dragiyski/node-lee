(function () {
    "use strict";
    var EventEmitter = require("..").EventEmitter;
    var Promise = require('bluebird');
    module.exports = {
        "test call as function": function (test) {
            var emitter = EventEmitter();
            test.ok(emitter instanceof EventEmitter);
            test.done();
        },
        "test has listeners": function (test) {
            var emitter = new EventEmitter, f = function () {}, g = function () {}, h = function () {};
            test.ok(!emitter.hasListener());
            test.ok(!emitter.hasListener("test"));
            emitter.on("test", f).on("test", g);
            test.ok(emitter.hasListener());
            test.ok(emitter.hasListener("test"));
            test.ok(emitter.hasListener("test", f));
            test.ok(emitter.hasListener("test", g));
            test.ok(!emitter.hasListener("test", h));
            test.done();
        },
        "test adding invalid listener": function (test) {
            var emitter = new EventEmitter;
            test.throws(function () {
                emitter.addEventListener("test", null);
            }, TypeError);
            test.throws(function () {
                emitter.once("test", null);
            }, TypeError);
            test.done();
        },
        "test remove non-existing listener": function (test) {
            var emitter = new EventEmitter, f = function () {}, g = function () {};
            emitter.on("test", g);
            test.ok(emitter.hasListener("test"));
            test.ok(!emitter.hasListener("test", f));
            test.doesNotThrow(function () {
                emitter.removeListener("test", f);
                emitter.removeListener("test2", f);
            });
            test.done();
        },
        "test remove existing listener": function (test) {
            var emitter = new EventEmitter, f = function () {}, g = function () {};
            emitter.on("test", f);
            emitter.once("test", g);
            test.ok(emitter.hasListener("test"));
            test.ok(emitter.hasListener("test", f));
            test.ok(emitter.hasListener("test", g));
            emitter.off("test", f).off("test", g);
            test.ok(!emitter.hasListener("test", f));
            test.ok(!emitter.hasListener("test", g));
            test.ok(!emitter.hasListener("test"));
            test.done();
        },
        "test empty emitter (parallel)": function (test) {
            test.expect(1);
            var emitter = new EventEmitter;
            emitter.emit("test").then(function () {
                test.ok(true);
            }).finally(function () {
                test.done();
            });
        },
        "test empty emitter (series)": function (test) {
            test.expect(1);
            var emitter = new EventEmitter;
            var promise = emitter.emitSeries("test");
            promise.then(function () {
                test.ok(true);
            }).finally(function () {
                test.done();
            });
        },
        "test without dependencies (parallel)": function (test) {
            test.expect(6);
            var emitter = new EventEmitter, a = 1, b = 1, makeTwoA = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        a = 2;
                        resolve();
                    });
                });
            }, makeTwoB = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        b = 2;
                        resolve();
                    });
                });
            };
            emitter.on("test", makeTwoA).on("test", makeTwoB);
            emitter.emit("test").then(function () {
                test.strictEqual(a, 2);
                test.strictEqual(b, 2);
                test.ok(emitter.hasListener());
                test.ok(emitter.hasListener("test"));
                test.ok(emitter.hasListener("test", makeTwoA));
                test.ok(emitter.hasListener("test", makeTwoB));
            }).finally(function () {
                test.done();
            });
        },
        "test without dependencies (series)": function (test) {
            test.expect(10);
            var emitter = new EventEmitter, a = 1, b = 1, makeTwoA = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        test.strictEqual(a, 1);
                        test.strictEqual(b, 1);
                        a = 2;
                        resolve();
                    });
                });
            }, makeTwoB = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        test.strictEqual(a, 2);
                        test.strictEqual(b, 1);
                        b = 2;
                        resolve();
                    });
                });
            };
            emitter.on("test", makeTwoA).on("test", makeTwoB);
            emitter.emitSeries("test").then(function () {
                test.strictEqual(a, 2);
                test.strictEqual(b, 2);
                test.ok(emitter.hasListener());
                test.ok(emitter.hasListener("test"));
                test.ok(emitter.hasListener("test", makeTwoA));
                test.ok(emitter.hasListener("test", makeTwoB));
            }).finally(function () {
                test.done();
            });
        },
        "test once removal (parallel)": function (test) {
            test.expect(1);
            var emitter = new EventEmitter, listener = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        resolve();
                    });
                });
            };
            emitter.once("test", listener);
            emitter.emit("test").then(function () {
                test.ok(!emitter.hasListener(listener));
            }).finally(function () {
                test.done();
            });
        },
        "test once removal (series)": function (test) {
            test.expect(1);
            var emitter = new EventEmitter, listener = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        resolve();
                    });
                });
            };
            emitter.once("test", listener);
            emitter.emitSeries("test").then(function () {
                test.ok(!emitter.hasListener(listener));
            }).finally(function () {
                test.done();
            });
        },
        "test remove all listeners from event": function (test) {
            var emitter = new EventEmitter, f = function () {}, g = function () {};
            emitter.on("test", f).on("test", g);
            test.ok(emitter.hasListener("test"));
            emitter.removeAllListeners("test");
            test.ok(!emitter.hasListener("test"));
            test.done();
        },
        "test remove all listeners globally": function (test) {
            var emitter = new EventEmitter, f = function () {}, g = function () {};
            emitter.on("test", f).on("test2", g);
            test.ok(emitter.hasListener());
            emitter.removeAllListeners();
            test.ok(!emitter.hasListener());
            test.done();
        },
        "test add listener is only once": function (test) {
            var emitter = new EventEmitter, f = function () {}, g = function () {};
            emitter.on("test", f).on("test", f);
            emitter.removeListener("test", f);
            test.ok(!emitter.hasListener());
            emitter.once("test", g).once("test", g);
            emitter.removeListener("test", g);
            test.ok(!emitter.hasListener());
            test.done();
        },
        "test listener promotion (parallel)": function (test) {
            test.expect(3);
            var emitter = new EventEmitter, f = function () {};
            emitter.once("test", f);
            emitter.on("test", f);
            emitter.emit("test").then(function () {
                test.ok(emitter.hasListener());
                test.ok(emitter.hasListener("test"));
                test.ok(emitter.hasListener("test", f));
            }).finally(function () {
                test.done();
            });
        },
        "test listener promotion (series)": function (test) {
            test.expect(3);
            var emitter = new EventEmitter, f = function () {};
            emitter.once("test", f);
            emitter.on("test", f);
            emitter.emitSeries("test").then(function () {
                test.ok(emitter.hasListener());
                test.ok(emitter.hasListener("test"));
                test.ok(emitter.hasListener("test", f));
            }).finally(function () {
                test.done();
            });
        },
        "test with dependencies (parallel)": function (test) {
            test.expect(22);
            var emitter = new EventEmitter;
            var a = 1, b = 1, c = 1, d = 1;
            var makeTwoA = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        test.strictEqual(a, 1);
                        test.strictEqual(b, 1);
                        test.strictEqual(c, 1);
                        test.strictEqual(d, 1);
                        a = 2;
                        resolve();
                    });
                });
            }, makeTwoB = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        test.strictEqual(a, 2);
                        test.strictEqual(b, 1);
                        test.strictEqual(c, 2);
                        test.strictEqual(d, 2);
                        b = 2;
                        resolve();
                    });
                });
            }, makeTwoC = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        test.strictEqual(a, 2);
                        test.strictEqual(b, 1);
                        test.strictEqual(c, 1);
                        c = 2;
                        resolve();
                    });
                });
            }, makeTwoD = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        test.strictEqual(a, 2);
                        test.strictEqual(b, 1);
                        test.strictEqual(d, 1);
                        d = 2;
                        resolve();
                    });
                });
            };
            emitter.once("test", makeTwoC, [makeTwoA])
                .on("test", makeTwoA)
                .on("test", makeTwoB, [makeTwoC, makeTwoD])
                .on("test", makeTwoD, [makeTwoA]);
            emitter.emit("test").then(function () {
                test.strictEqual(a, 2);
                test.strictEqual(b, 2);
                test.strictEqual(c, 2);
                test.strictEqual(d, 2);
                test.ok(emitter.hasListener("test", makeTwoA));
                test.ok(emitter.hasListener("test", makeTwoB));
                test.ok(!emitter.hasListener("test", makeTwoC));
                test.ok(emitter.hasListener("test", makeTwoD));
            }).finally(function () {
                test.done();
            });
        },
        "test with dependencies (series)": function (test) {
            test.expect(20);
            var emitter = new EventEmitter;
            var a = 1, b = 1, c = 1, d = 1;
            var makeTwoA = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        test.strictEqual(a, 1);
                        test.strictEqual(b, 1);
                        test.strictEqual(c, 1);
                        test.strictEqual(d, 1);
                        a = 2;
                        resolve();
                    });
                });
            }, makeTwoB = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        test.strictEqual(a, 2);
                        test.strictEqual(b, 1);
                        test.strictEqual(c, 2);
                        test.strictEqual(d, 2);
                        b = 2;
                        resolve();
                    });
                });
            }, makeTwoC = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        test.strictEqual(a, 2);
                        test.strictEqual(b, 1);
                        test.strictEqual(c, 1);
                        test.strictEqual(d, 1);
                        c = 2;
                        resolve();
                    });
                });
            }, makeTwoD = function () {
                return new Promise(function (resolve) {
                    setImmediate(function () {
                        test.strictEqual(a, 2);
                        test.strictEqual(b, 1);
                        test.strictEqual(c, 2);
                        test.strictEqual(d, 1);
                        d = 2;
                        resolve();
                    });
                });
            };
            emitter.on("test", makeTwoC, [makeTwoA])
                .on("test", makeTwoA)
                .on("test", makeTwoB, [makeTwoC, makeTwoD])
                .on("test", makeTwoD, [makeTwoA, makeTwoC]);
            emitter.emitSeries("test").then(function () {
                test.strictEqual(a, 2);
                test.strictEqual(b, 2);
                test.strictEqual(c, 2);
                test.strictEqual(d, 2);
            }).finally(function () {
                test.done();
            });
        },
        "test circular reference detection (parallel)": function (test) {
            test.expect(2);
            var emitter = new EventEmitter, f = function () {}, g = function () {}, h = function () {};
            emitter.on("test", f, [g]).on("test", g, [h]).on("test", h, [f]);
            emitter.emit("test").catch(function (err) {
                test.ok(err instanceof ReferenceError);
                test.strictEqual(err.code, 'CIRCULAR_REFERENCE');
            }).finally(function () {
                test.done();
            });
        },
        "test circular reference detection (series)": function (test) {
            var emitter = new EventEmitter, f = function () {}, g = function () {}, h = function () {};
            emitter.on("test", f, [g]).on("test", g, [h]).on("test", h, [f]);
            emitter.emitSeries("test").catch(function (err) {
                test.ok(err instanceof ReferenceError);
                test.strictEqual(err.code, 'CIRCULAR_REFERENCE');
            }).finally(function () {
                test.done();
            });
        },
        "test passing invalid dependency": function (test) {
            var emitter = new EventEmitter, f = function () {}, g = function () {}, o = {};
            var arrayLikeInvalidLength = function () {
                var o = {};
                Array.prototype.forEach.call(arguments, function (element, index) {
                    o[index] = element;
                });
                o.length = "asd";
                return o;
            }, arrayLikeInfiniteLength = function () {
                var o = {};
                Array.prototype.forEach.call(arguments, function (element, index) {
                    o[index] = element;
                });
                o.length = Infinity;
                return o;
            }, arrayLikeNegativeLength = function () {
                var o = {};
                Array.prototype.forEach.call(arguments, function (element, index) {
                    o[index] = element;
                });
                o.length = -256;
                return o;
            }, arrayLikeOverflowLength = function () {
                var o = {};
                Array.prototype.forEach.call(arguments, function (element, index) {
                    o[index] = element;
                });
                o.length = 4294967299;
                return o;
            }, arrayLikeFloatLength = function () {
                var o = {};
                Array.prototype.forEach.call(arguments, function (element, index) {
                    o[index] = element;
                });
                o.length = 5.4;
                return o;
            };
            test.throws(function () {
                emitter.on("test", f, o);
            }, TypeError);
            test.throws(function () {
                emitter.once("test", f, o);
            }, TypeError);
            test.throws(function () {
                emitter.on("test", f, [o]);
            }, TypeError);
            test.throws(function () {
                emitter.once("test", f, [o]);
            }, TypeError);
            test.throws(function () {
                emitter.on("test", f, [f]);
            }, ReferenceError);
            test.throws(function () {
                emitter.once("test", f, [f]);
            }, ReferenceError);
            test.throws(function () {
                emitter.once("test", f, arrayLikeInvalidLength(g));
            }, TypeError);
            test.throws(function () {
                emitter.once("test", f, arrayLikeInfiniteLength(g));
            }, TypeError);
            test.throws(function () {
                emitter.once("test", f, arrayLikeNegativeLength(g));
            }, TypeError);
            test.throws(function () {
                emitter.once("test", f, arrayLikeOverflowLength(g));
            }, TypeError);
            test.throws(function () {
                emitter.once("test", f, arrayLikeFloatLength(g));
            }, TypeError);
            test.throws(function () {
                emitter.once("test", f, null);
            }, TypeError);
            test.throws(function () {
                emitter.once("test", f, undefined);
            }, TypeError);

            test.throws(function () {
                emitter.once("test", f, 2);
            }, TypeError);
            test.done();
        },
        "test passing dependencies again": function (test) {
            var emitter = new EventEmitter, f = function () {}, g = function () {};
            test.ok(!emitter.hasListener("test", f));
            test.ok(!emitter.hasListener("test", g));
            emitter.on("test", f, [g]);
            test.ok(emitter.hasListener("test", f));
            test.ok(emitter.hasListener("test", g));
            test.doesNotThrow(function () {
                emitter.on("test", f, [g]);
            });
            emitter.removeAllListeners();
            test.ok(!emitter.hasListener("test", f));
            test.ok(!emitter.hasListener("test", g));
            emitter.once("test", f, [g]);
            test.ok(emitter.hasListener("test", f));
            test.ok(emitter.hasListener("test", g));
            test.doesNotThrow(function () {
                emitter.once("test", f, [g]);
            });
            emitter.removeAllListeners();
            test.ok(!emitter.hasListener("test", f));
            test.ok(!emitter.hasListener("test", g));
            emitter.once("test", f, [g]);
            test.ok(emitter.hasListener("test", f));
            test.ok(emitter.hasListener("test", g));
            test.doesNotThrow(function () {
                emitter.on("test", f, [g]);
            });
            emitter.removeAllListeners();
            test.ok(!emitter.hasListener("test", f));
            test.ok(!emitter.hasListener("test", g));
            emitter.on("test", f, [g]);
            test.ok(emitter.hasListener("test", f));
            test.ok(emitter.hasListener("test", g));
            test.doesNotThrow(function () {
                emitter.once("test", f, [g]);
            });
            test.done();
        },
        "test dependencies argument form": function (test) {
            test.expect(18);
            var emitter = new EventEmitter, makeArgs = function () { return arguments; }, object = {},
                createAttribute = function (name, check) {
                    object[name] = {
                        value: 1,
                        listener: function () {
                            return new Promise(function (resolve) {
                                setImmediate(function () {
                                    if (typeof check === 'function') {
                                        check();
                                    }
                                    ++object[name].value;
                                    resolve();
                                });
                            });
                        }
                    };
                };
            createAttribute("a", function () {
                test.strictEqual(object.a.value, 1);
                test.strictEqual(object.b.value, 1);
                test.strictEqual(object.c.value, 1);
                test.strictEqual(object.d.value, 1);
            });
            createAttribute("b", function () {
                test.strictEqual(object.a.value, 2);
                test.strictEqual(object.b.value, 1);
                test.strictEqual(object.d.value, 1);
            });
            createAttribute("c", function () {
                test.strictEqual(object.a.value, 2);
                test.strictEqual(object.c.value, 1);
                test.strictEqual(object.d.value, 1);
            });
            createAttribute("d", function () {
                test.strictEqual(object.a.value, 2);
                test.strictEqual(object.b.value, 2);
                test.strictEqual(object.c.value, 2);
                test.strictEqual(object.d.value, 1);
            });
            emitter.on("test", object.a.listener);
            emitter.on("test", object.b.listener, makeArgs(object.a.listener));
            emitter.on("test", object.c.listener, makeArgs(object.a.listener));
            emitter.on("test", object.d.listener, makeArgs(object.b.listener, object.c.listener));
            emitter.emit("test").then(function () {
                test.strictEqual(object.a.value, 2);
                test.strictEqual(object.b.value, 2);
                test.strictEqual(object.c.value, 2);
                test.strictEqual(object.d.value, 2);
            }).finally(function () {
                test.done();
            });
        },
        "test dependencies custom form": function (test) {
            test.expect(18);
            var emitter = new EventEmitter, makeArgs = function () {
                    var o = {};
                    Array.prototype.forEach.call(arguments, function (element, index) {
                        o[index] = element;
                    });
                    o.length = arguments.length;
                    return o;
                }, object = {},
                createAttribute = function (name, check) {
                    object[name] = {
                        value: 1,
                        listener: function () {
                            return new Promise(function (resolve) {
                                setImmediate(function () {
                                    if (typeof check === 'function') {
                                        check();
                                    }
                                    ++object[name].value;
                                    resolve();
                                });
                            });
                        }
                    };
                };
            createAttribute("a", function () {
                test.strictEqual(object.a.value, 1);
                test.strictEqual(object.b.value, 1);
                test.strictEqual(object.c.value, 1);
                test.strictEqual(object.d.value, 1);
            });
            createAttribute("b", function () {
                test.strictEqual(object.a.value, 2);
                test.strictEqual(object.b.value, 1);
                test.strictEqual(object.d.value, 1);
            });
            createAttribute("c", function () {
                test.strictEqual(object.a.value, 2);
                test.strictEqual(object.c.value, 1);
                test.strictEqual(object.d.value, 1);
            });
            createAttribute("d", function () {
                test.strictEqual(object.a.value, 2);
                test.strictEqual(object.b.value, 2);
                test.strictEqual(object.c.value, 2);
                test.strictEqual(object.d.value, 1);
            });
            emitter.on("test", object.a.listener);
            emitter.on("test", object.b.listener, object.a.listener);
            emitter.once("test", object.c.listener, object.a.listener);
            emitter.on("test", object.d.listener, makeArgs(object.b.listener, object.c.listener));
            emitter.emit("test").then(function () {
                test.strictEqual(object.a.value, 2);
                test.strictEqual(object.b.value, 2);
                test.strictEqual(object.c.value, 2);
                test.strictEqual(object.d.value, 2);
            }).finally(function () {
                test.done();
            });
        },
        "test upgrading auto-inserted dependency": function (test) {
            test.expect(4);
            var emitter = new EventEmitter, object = {},
                createAttribute = function (name, check) {
                    object[name] = {
                        value: 1,
                        listener: function () {
                            return new Promise(function (resolve) {
                                setImmediate(function () {
                                    if (typeof check === 'function') {
                                        check();
                                    }
                                    ++object[name].value;
                                    resolve();
                                });
                            });
                        }
                    };
                };
            createAttribute("a");
            createAttribute("b");
            createAttribute("c");
            createAttribute("d");
            emitter.on("test", object.d.listener, [object.b.listener, object.c.listener]);
            emitter.once("test", object.b.listener, [object.a.listener]);
            emitter.on("test", object.c.listener, [object.a.listener]);
            emitter.emit("test").then(function () {
                test.strictEqual(object.a.value, 2);
                test.strictEqual(object.b.value, 2);
                test.strictEqual(object.c.value, 2);
                test.strictEqual(object.d.value, 2);
            }).finally(function () {
                test.done();
            });
        },
        "test removing auto-inserted dependency": function (test) {
            test.expect(8);
            var emitter = new EventEmitter, object = {},
                createAttribute = function (name, check) {
                    object[name] = {
                        value: 1,
                        listener: function () {
                            return new Promise(function (resolve) {
                                setImmediate(function () {
                                    if (typeof check === 'function') {
                                        check();
                                    }
                                    ++object[name].value;
                                    resolve();
                                });
                            });
                        }
                    };
                };
            createAttribute("a");
            createAttribute("b");
            createAttribute("c");
            createAttribute("d");
            emitter.on("test", object.d.listener, [object.b.listener, object.c.listener]);
            emitter.once("test", object.b.listener, [object.a.listener]);
            emitter.on("test", object.c.listener, [object.a.listener]);
            emitter.emit("test").then(function () {
                test.ok(emitter.hasListener("test", object.a.listener));
                test.ok(!emitter.hasListener("test", object.b.listener));
                test.ok(emitter.hasListener("test", object.c.listener));
                test.ok(emitter.hasListener("test", object.d.listener));
                emitter.removeListener("test", object.c.listener);
                test.ok(!emitter.hasListener("test", object.a.listener));
                test.ok(!emitter.hasListener("test", object.b.listener));
                test.ok(!emitter.hasListener("test", object.c.listener));
                test.ok(emitter.hasListener("test", object.d.listener));
            }).finally(function () {
                test.done();
            });
        },
        "test getting listeners sorted": function (test) {
            var emitter = new EventEmitter, object = {},
                createAttribute = function (name, check) {
                    object[name] = {
                        value: 1,
                        listener: function () {
                            return new Promise(function (resolve) {
                                setImmediate(function () {
                                    if (typeof check === 'function') {
                                        check();
                                    }
                                    ++object[name].value;
                                    resolve();
                                });
                            });
                        }
                    };
                };
            createAttribute("a");
            createAttribute("b");
            createAttribute("c");
            createAttribute("d");
            emitter.on("test", object.d.listener, [object.b.listener, object.c.listener]);
            emitter.once("test", object.b.listener, [object.a.listener]);
            emitter.on("test", object.c.listener, [object.a.listener]);
            var listenerList = emitter.getSortedListenerList("test");
            test.ok(listenerList[0] === object.a.listener);
            test.ok(listenerList[1] === object.b.listener || listenerList[1] === object.c.listener);
            test.ok(listenerList[2] === object.b.listener || listenerList[2] === object.c.listener);
            test.ok(listenerList[3] === object.d.listener);
            test.done();
        },
        "test getting listeners grouped": function (test) {
            var emitter = new EventEmitter, object = {},
                createAttribute = function (name, check) {
                    object[name] = {
                        value: 1,
                        listener: function () {
                            return new Promise(function (resolve) {
                                setImmediate(function () {
                                    if (typeof check === 'function') {
                                        check();
                                    }
                                    ++object[name].value;
                                    resolve();
                                });
                            });
                        }
                    };
                };
            createAttribute("a");
            createAttribute("b");
            createAttribute("c");
            createAttribute("d");
            emitter.on("test", object.d.listener, [object.b.listener, object.c.listener]);
            emitter.once("test", object.b.listener, [object.a.listener]);
            emitter.on("test", object.c.listener, [object.a.listener]);
            var listenerList = emitter.getGroupedListenerList("test");
            test.ok(listenerList[0][0] === object.a.listener);
            test.ok(listenerList[1][0] === object.b.listener || listenerList[1][0] === object.c.listener);
            test.ok(listenerList[1][1] === object.b.listener || listenerList[1][1] === object.c.listener);
            test.ok(listenerList[2][0] === object.d.listener);
            test.done();
        },
        "test getting listeners dependencies": function (test) {
            var emitter = new EventEmitter, object = {},
                createAttribute = function (name, check) {
                    object[name] = {
                        value: 1,
                        listener: function () {
                            return new Promise(function (resolve) {
                                setImmediate(function () {
                                    if (typeof check === 'function') {
                                        check();
                                    }
                                    ++object[name].value;
                                    resolve();
                                });
                            });
                        }
                    };
                };
            createAttribute("a");
            createAttribute("b");
            createAttribute("c");
            createAttribute("d");
            emitter.on("test", object.d.listener, [object.b.listener, object.c.listener]);
            emitter.once("test", object.b.listener, [object.a.listener]);
            emitter.on("test", object.c.listener, [object.a.listener]);
            object.a.dependencies = emitter.getListenerDependencyList("test", object.a.listener);
            object.b.dependencies = emitter.getListenerDependencyList("test", object.b.listener);
            object.c.dependencies = emitter.getListenerDependencyList("test", object.c.listener);
            object.d.dependencies = emitter.getListenerDependencyList("test", object.d.listener);
            test.strictEqual(object.a.dependencies.length, 0);
            test.strictEqual(object.b.dependencies.length, 1);
            test.strictEqual(object.b.dependencies[0], object.a.listener);
            test.strictEqual(object.c.dependencies.length, 1);
            test.strictEqual(object.c.dependencies[0], object.a.listener);
            test.strictEqual(object.d.dependencies.length, 2);
            test.ok(object.d.dependencies[0] === object.b.listener || object.d.dependencies[0] === object.c.listener);
            test.ok(object.d.dependencies[1] === object.b.listener || object.d.dependencies[1] === object.c.listener);
            var nonExistingEvent = emitter.getListenerDependencyList("test2", object.a.listener);
            var nonExistingListener = emitter.getListenerDependencyList("test", function () {});
            test.ok(Array.isArray(nonExistingEvent));
            test.strictEqual(nonExistingEvent.length, 0);
            test.ok(Array.isArray(nonExistingListener));
            test.strictEqual(nonExistingListener.length, 0);
            test.done();
        }
    };
})();