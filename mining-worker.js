/* Web Worker entry: thin shell around the pure miner session in bitcoin.js. */
"use strict";
importScripts("./sha256.js", "./bitcoin.js");

const session = self.TetroHashBitcoin.createMinerSession((message) => self.postMessage(message));
self.onmessage = (event) => session.handle(event.data);
