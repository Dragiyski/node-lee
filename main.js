if (process.env.LEE_COVERAGE) {
    exports.EventEmitter = require("./lib-cov/EventEmitter");
} else {
    exports.EventEmitter = require("./lib/EventEmitter");
}