# node-lee
Asynchronous event emitter with listener ordering.

## Install

Just execute the following command:

```
npm install lee
```

It is that easy.

## Test

You must install the library with ``--dev`` flag:

```
npm install --dev lee
```

and then you can run:

```
npm test
```

and more... you can check the test coverage by running:

```
npm run coverage
```

## Features

This library have almost all features of ``require("events")``, but following is different:
* No events are fired when event listeners are added/removed.
* **Asynchronous Event Listeners** - The event listeners can return everything that **bluebird** recognizes as a
promise, to say that the listener is performing some asynchronous operations and it is probably not completed, yet.
* **Event Listeners Order** - The event listeners can be ordered by specifying dependencies. Each listener will be
executed only after their dependencies complete execution, that means if those dependencies returned a promise, that
promise is resolved.

## Documentation

Since this library has compatible interface to ``require("events")`` you can guess most of its methods. If not, there
is API reference in the GitHub wiki.