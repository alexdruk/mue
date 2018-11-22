const ccxt = require('ccxt');

module.exports = {
    get_ins: async function (exchange, symbol, interval) {
        const records = 200
        try {
            //let low, high, open, close, vol, at = [];
            let ins = {
                low: [],
                high: [],
                open: [],
                close: [],
                volume: [],
                at: []
            };
            let ohlcv = await exchange.fetchOHLCV(symbol, interval);
            ins.at = ohlcv.slice(-records).map(x => x[0]); // timestamp
            ins.open = ohlcv.slice(-records).map(x => x[1]); // open
            ins.high = ohlcv.slice(-records).map(x => x[2]); // high
            ins.low = ohlcv.slice(-records).map(x => x[3]); // low
            ins.close = ohlcv.slice(-records).map(x => x[4]); // closing price
            ins.volume = ohlcv.slice(-records).map(x => x[5]); // volume    
            return ins;
        } catch (e) {
            if (e instanceof ccxt.DDoSProtection) {
                console.log(exchange, '[DDoS Protection] ' + e.message);
                //                continue;
            } else if (e instanceof ccxt.RequestTimeout) {
                console.log(exchange, '[Request Timeout] ' + e.message);
                //                continue;
            } else if (e instanceof ccxt.AuthenticationError) {
                console.log(exchange, '[Authentication Error] ' + e.message);
                //                continue;
            } else if (e instanceof ccxt.ExchangeNotAvailable) {
                console.log(exchange, '[Exchange Not Available] ' + e.message);
                //                continue;
            } else if (e instanceof ccxt.ExchangeError) {
                console.log(exchange.id, '[Exchange Error] ' + e.message);
                //                continue;
            } else if (e instanceof ccxt.NetworkError) {
                console.log(exchange.id, '[Network Error] ' + e.message);
                //               continue;
            } else {
                log.red({
                    "error": e
                });
                return null;
            }
        }

    },

    get_balance: async function (exchange) {
        try {
            // fetch account balance from the exchange
            let balance = await exchange.fetchBalance();
            if (balance) {
                //                console.log(balance.info);
                return balance.info;
            } else {
                return null;
            }
        } catch (e) {

            if (e instanceof ccxt.DDoSProtection || e.message.includes('ECONNRESET')) {
                console.log('[DDoS Protection] ' + e.message);
            } else if (e instanceof ccxt.RequestTimeout) {
                console.log('[Request Timeout] ' + e.message);
            } else if (e instanceof ccxt.AuthenticationError) {
                console.log('[Authentication Error] ' + e.message);
            } else if (e instanceof ccxt.ExchangeNotAvailable) {
                console.log('[Exchange Not Available Error] ' + e.message);
            } else if (e instanceof ccxt.ExchangeError) {
                console.log('[Exchange Error] ' + e.message);
            } else if (e instanceof ccxt.NetworkError) {
                console.log('[Network Error] ' + e.message);
            } else {
                throw e;
            }
        }
    },
    get_last_price: async function (exchange, symbol) {
        if (exchange.has['fetchTicker']) {
            let ticker = await exchange.fetchTicker(symbol);
            //            console.log('last price:', ticker.last);
            return ticker.last;
        } else {
            console.log(exchange, 'has no method to fetch ticker.')
            return null;
        }
    },
    get_orderBook: async function (exchange, symbol) {
        records = 20;
        let orderBook = {
            bids: [],
            asks: []
        };
        try {
            let book = await exchange.fetchOrderBook(symbol);
            orderBook.bids = book.bids.slice(0, records); //first 20
            orderBook.asks = book.asks.slice(0, records);
            return orderBook;
        } catch (e) {
            if (e instanceof ccxt.DDoSProtection || e.message.includes('ECONNRESET')) {
                console.log('[DDoS Protection] ' + e.message);
            } else if (e instanceof ccxt.RequestTimeout) {
                console.log('[Request Timeout] ' + e.message);
            } else if (e instanceof ccxt.AuthenticationError) {
                console.log('[Authentication Error] ' + e.message);
            } else if (e instanceof ccxt.ExchangeNotAvailable) {
                console.log('[Exchange Not Available Error] ' + e.message);
            } else if (e instanceof ccxt.ExchangeError) {
                console.log('[Exchange Error] ' + e.message);
            } else if (e instanceof ccxt.NetworkError) {
                console.log('[Network Error] ' + e.message);
            } else {
                throw e;
            }
        }
    }
}