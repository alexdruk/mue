// usage: node vailable_methods.js
//if true - // available from the exchange directly and implemented in ccxt
//if false - // not available from the exchange or not implemented in ccxt
//if emulated - // not available from the exchange, but emulated in ccxt

const ccxt = require("ccxt");
const id = "poloniex";
exchange = new ccxt[id]();
console.log(exchange.has);
