# node-lee
Asynchronous event emitter with listener ordering.

## What?

This is a library perform almost the same as ``require('events')`` library in *NodeJS*. The *events* library contains
class ``EventEmitter`` which can be extended or used directly to store event listeners and emit events. However
*NodeJS* is usually used for asynchronous operations. Emitting event return as soon as all event listeners return. If
they have started asynchronous operation, it is completely ignored. This library is here for those who wants to support
asynchronous operations for event listeners.

## Why?

*Note: Skipping this section is recommended if you don't like theory and concepts.*

Usually event emitter is just a model to create asynchronous operation in the first place. Instead of waiting some
operation, emitter is returned. The library user then attaches listeners to be called when object is ready. This is
only useful when there are multiple event types. If only two event types exists like "ready" and "error", a better
approach is used instead of event emitter - function accept callback directly.

The most advanced approach on asynchronous operation is promises. They are better because they do not chance the
interface of function and methods (no additional callback is required) and a library named **bluebird** makes it
possible to make complex control flow of promises (each could be taken from asynchronous operation). Promise is just a
wrapper object for single value, which is not ready, yet. That value will be ready after successful asynchronous
operation. Promises contain very neat way with similar to exception terminology to handle unsuccessful asynchronous
operations.

While promises supersede callback approach, callback approach and promises are not always usable. For example an HTTP
server emits "connection" event multiple times for each new connection. This cannot be (easily and obviously) done with
promises. That's why event emitter is not superseded by promises. Instead choosing one approach over another, this
library allow to mix the two approaches into one more powerful system.

## How?

This library is completely compatible with *NodeJS* **events** library. Add event listeners, emit event and profit.
However following features are supported.

* If your listener return a promise or thenable (object containing ``then`` method) or anything **bluebird** recognize
as *promise*, the ``emit`` method does not return until that promise is resolved.
* It is possible to call ``emit`` in parallel or serially. If called serially and a listener return a promise, that
promise will be resolved before calling next listener.
* Ability to order listener based on dependencies.

## Features

Here is a conceptual description of features different from **events** library.

### Asynchronous

If your listener should perform some asynchronous operation (even result of it is not relevant) it should return a
promise. A promise can be *thenable* object - object that has *then* which accepts one or two callbacks as arguments.
This library uses **bluebird** promises as they are most advanced in features and compatible with A+ standard by the
time this library is developed. Therefore a promise can be **bluebird** promise. Finally if ES6 is available a promise
exists as native class and generally should be compatible to **bluebird** so native promises can be used as well.

By using promises there is no change in interface of function (since return value type is not part of interface in JS).
If listener return non-promise value (including undefined) it is assumed it hasn't started asynchronous operation and
it has complete its operation synchronously (by returning from function call). If you forget to return something in
listener, it returns undefined.

The upper statement allows to use this library for synchronous listeners with the same interface as *NodeJS* **events**
library. Adding only synchronous listeners and using only the first two arguments of ``addEventListener`` and its
synonyms is exactly the interface of **events**.

### Dependencies

By specifying third argument ``addEventListener`` to be array or array-like object of function, you specify
dependencies to newly added listener. If dependencies are not assigned as listener to specified event they are assigned
automatically. If called serially, event listeners will be called in such order that all their dependencies are called
before that. If called in parallel, first all independent listeners are called in implementation specific order
allowing all to start asynchronous operation in parallel. After all asynchronous operations of independent listeners
are completed, then all listeners depending ot already executed listeners are called and the process repeat until all
listeners are called.

Calling in parallel is not real parallelism, but asynchronous parallelism. This means that if listeners are synchronous
they are called one-after-another. However for example if one listener request SQL query to some database and other
request by HTTP some server, both are processed in parallel. However dependencies guarantees that all asynchronous
operations started by specified dependencies are completed before call the dependent listener.

### Error handling

All code (both library code and listener code) execute in "safe" environment wrapped by **bluebird** promise call.
This means if some library code (hopefully that never happens) or some listener throw exception, returned promise from
``emit`` or ``emitSeries`` is rejected. Therefore calling ``emit`` or ``emitSeries`` is not required to be wrapped in
try-catch block or domain to handle the errors. ``emit`` and ``emitSeries`` always return a promise, so you can call
``then`` with two callbacks (one for resolve, one for error catching) or call ``then`` and ``catch`` or everything else
**bluebird** library allow to do on its promise implementation.

## Interface

TODO...