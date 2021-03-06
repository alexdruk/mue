"use strict";
const ccxt = require("ccxt");
const moment = require("moment");

module.exports = {
  get_order_info: async function(exchange, orderID) {
    try {
      const response = await exchange.fetchOrder(orderID);
      //      console.log(response);
      console.log("Succeeded");
      for (const key in response) {
        console.log(key, response[key]);
      }
      return response;
    } catch (e) {
      console.log(exchange.iso8601(Date.now()), e.constructor.name, e.message);
      // let msg = e.constructor.name + " " + e.message;
      // this.sendError(msg);
      console.log("Failed");
      return null;
    }
  },
  create_order: async function(
    exchange,
    symbol,
    orderType,
    side,
    amount,
    price
  ) {
    try {
      const response = await exchange.createOrder(
        symbol,
        orderType,
        side,
        amount,
        price
      );
      //      console.log(response);
      console.log("Succeeded");
      for (const k in response.info.result) {
        console.log(k, response.info.result[k]);
      }
      for (const key in response) {
        console.log(key, response[key]);
      }
      return response;
    } catch (e) {
      console.log(exchange.iso8601(Date.now()), e.constructor.name, e.message);
      // let msg = e.constructor.name + " " + e.message;
      // this.sendError(msg);
      console.log("Failed");
      return null;
    }
  },
  get_ins: async function(exchange, symbol, interval, records) {
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
      this.parseError(e);
    }
  },

  get_account_info: async function(exchange, symbol) {
    let curr_available = 0;
    let assets_available = 0;
    let [assets_name, currency_name] = symbol.split("/");
    let balanceinfo = await this.get_balance(exchange);
    for (const key in balanceinfo) {
      if (balanceinfo.hasOwnProperty(key)) {
        const element = balanceinfo[key];
        if (element.Currency === currency_name) {
          curr_available = element.Available;
        } else if (element.Currency === assets_name) {
          assets_available += element.Available;
        }
      }
    }
    if (curr_available || assets_available) {
      return [curr_available, assets_available];
    } else {
      return [null, null];
    }
  },

  get_balance: async function(exchange) {
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
      this.parseError(e);
    }
  },
  get_last_price: async function(exchange, symbol) {
    if (exchange.has["fetchTicker"]) {
      try {
        let ticker = await exchange.fetchTicker(symbol);
        //            console.log('last price:', ticker.last);
        return ticker.last;
      } catch (error) {
        this.parseError(e);
      }
    } else {
      console.log(exchange, "has no method to fetch ticker.");
      return null;
    }
  },
  get_orderBook: async function(exchange, symbol, depth) {
    let toshow = depth;
    let orderBook = {
      bids: [],
      asks: []
    };
    try {
      let book = await exchange.fetchOrderBook(symbol);
      orderBook.bids = book.bids.slice(0, toshow); //first 20
      orderBook.asks = book.asks.slice(0, toshow);
      return orderBook;
    } catch (e) {
      this.parseError(e);
    }
  },
  get_MarketHist: async function(exchange, symbol, depth) {
    let ha = [];
    let toshow = depth;
    let timestamp_aday_ago = moment(new Date())
      .subtract(1, "days")
      .valueOf();
    try {
      let hist_arr = await exchange.fetchTrades(symbol, timestamp_aday_ago);
      hist_arr = hist_arr.reverse().slice(0, toshow);
      for (let i = 0; i < hist_arr.length; i++) {
        let hist = {
          time: "",
          type: "",
          side: "",
          price: 0,
          amount: "0",
          cost: "0"
        };
        hist.time = hist_arr[i].timestamp
          ? moment(hist_arr[i].timestamp).format("HH:mm:ss")
          : "";
        hist.type = hist_arr[i].type ? hist_arr[i].type : "";
        hist.side = hist_arr[i].side ? hist_arr[i].side : "";
        hist.price = hist_arr[i].price ? hist_arr[i].price : 0;
        hist.amount = hist_arr[i].amount ? hist_arr[i].amount.toFixed(8) : "0";
        hist.cost = hist_arr[i].cost ? hist_arr[i].cost.toFixed(8) : "0";
        ha.push(hist);
      }
      return ha;
    } catch (e) {
      this.parseError(e);
    }
  },
  get_openOrders: async function(exchange, symbol) {
    let openOrders = [];
    let timestamp_aday_ago = moment(new Date())
      .subtract(1, "days")
      .valueOf();
    try {
      let orders_arr = await exchange.fetchOpenOrders(
        symbol,
        timestamp_aday_ago
      );
      for (let i = 0; i < orders_arr.length; i++) {
        let order = {
          id: "",
          datetime: "",
          type: "",
          side: "",
          price: "0",
          cost: "0",
          amount: "0",
          filled: "0",
          remaining: "0",
          status: ""
        };
        order.id = orders_arr[i].id;
        order.datetime =
          moment.utc(orders_arr[i].timestamp).format("YYYY/MM/DD HH:mm:ss") +
          "(UTC)";
        order.type = orders_arr[i].type;
        order.side = orders_arr[i].side;
        order.price = orders_arr[i].price.toFixed(8);
        order.cost = orders_arr[i].cost.toFixed(8);
        order.amount = orders_arr[i].amount.toFixed(8);
        order.filled = orders_arr[i].filled.toFixed(8);
        order.remaining = orders_arr[i].remaining.toFixed(8);
        order.status = orders_arr[i].status;
        openOrders.push(order);
      }
      return openOrders;
    } catch (e) {
      this.parseError(e);
    }
  },
  get_closedOrders: async function(exchange, symbol) {
    let ClosedOrders = [];
    let timestamp_aday_ago = moment(new Date())
      .subtract(1, "days")
      .valueOf();
    try {
      let ohist = await exchange.fetchClosedOrders(symbol, timestamp_aday_ago);
      for (let i = 0; i < ohist.length; i++) {
        let order = {
          id: "",
          open: "",
          closed: "",
          side: "",
          price: "0",
          cost: "0",
          amount: "0",
          filled: "0",
          remaining: "0",
          status: ""
        };
        order.id = ohist[i].id;
        order.open =
          moment.utc(ohist[i].info.TimeStamp).format("YYYY/MM/DD HH:mm:ss") +
          "(UTC)";
        order.closed =
          moment.utc(ohist[i].info.Closed).format("YYYY/MM/DD HH:mm:ss") +
          "(UTC)";
        order.side = ohist[i].side;
        order.price = ohist[i].price.toFixed(8);
        order.cost = ohist[i].cost.toFixed(8);
        order.amount = ohist[i].amount.toFixed(8);
        order.filled = ohist[i].filled.toFixed(8);
        order.remaining = ohist[i].remaining.toFixed(8);
        order.status = ohist[i].status;
        ClosedOrders.push(order);
      }
      //      console.log("ClosedOrders:", ClosedOrders);
      return ClosedOrders;
    } catch (e) {
      this.parseError(e);
    }
  },
  sendError: function(data) {
    const message_str = JSON.stringify(data);
    if (ws) {
      ws.send(message_str);
    } else {
      console.log(message_str);
    }
  },
  parseError: function(e) {
    if (e instanceof ccxt.DDoSProtection || e.message.includes("ECONNRESET")) {
      console.log("[DDoSProtection]" + e.message);
      //            this.sendError(ws, 'Fatal error: [DDoS Protection] ' + e.message) + ' Try to restart.';
    } else if (e instanceof ccxt.RequestTimeout) {
      console.log("[Request Timeout] " + e.message + " Try to restart later");
      //            this.sendError(ws, 'Error: [Request Timeout] ' + e.message);
    } else if (e instanceof ccxt.AuthenticationError) {
      console.log("[Authentication Error] " + e.message);
      //            this.sendError(ws, 'Fatal error: [Authentication Error] ' + e.message + ' Enter valid keys.');
    } else if (e instanceof ccxt.ExchangeNotAvailable) {
      console.log(
        "[Exchange Not Available Error] " + e.message + " Try to restart later"
      );
      //            this.sendError(ws, 'Error: [Exchange Not Available Error] ' + e.message);
    } else if (e instanceof ccxt.ExchangeError) {
      console.log("[Exchange Error] " + e.message);
      //            this.sendError(ws, 'Fatal error: [Exchange Error] ' + e.message + ' Try to restart.');
    } else if (e instanceof ccxt.NetworkError) {
      console.log("[Network Error] " + e.message);
      //            this.sendError(ws, 'Fatal error: [Network Error] ' + e.message + ' Try to restart later');
    } else {
      //            this.sendError('Fatal error: ' + e.message);
      throw e;
    }
  },

  sleep: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
