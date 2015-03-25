(function () {
    "use strict";
    var EventEmitter = require("./").EventEmitter;
    var Promise = require('bluebird');
    var test = require('assert');
    test.done = function () {
        process.exit(0);
    };
    test.expect = function () {};

    test.expect(8);
    var emitter = new EventEmitter, object = {},
        createAttribute = function (name, check) {
            object[name] = {
                value: 1,
                listener: function () {
                    return new Promise(function (resolve, reject) {
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
})();