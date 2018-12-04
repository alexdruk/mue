"use strict";

const ccxt = require("ccxt");
const creds = require("./api_keys.js");
const exchange_funct = require("./exchange_funct.js");
const WebSocket = require("ws");
const moment = require("moment");
const exchangeId = "bittrex";
const fs = require("fs");
const filename = "./data/orders.csv";
const exchangeClass = ccxt[exchangeId];
const exchange = new ccxt.bittrex({
  apiKey: creds.apiKey,
  secret: creds.secret,
  timeout: 30000,
  enableRateLimit: true,
  verbose: false
});
let storage = {
  inibalance: 0,
  inibalance_as_string: "",
  tick: 0
};
let prev_last_bid;
let prev_last_bid_vol;
let prev_last_ask;
let prev_last_ask_vol;
//-----------------------------------------------------------------------------
let symbol = "MUE/BTC"; // default
let cycle;

//getData();
//startCycle();

function setTicker(ws, ticker) {
  console.log("new ticker", ticker);
  symbol = ticker;
  getData(ws);
}

function stopCycle() {
  if (cycle) {
    clearInterval(cycle);
    cycle = null;
  }
}

function startCycle(ws) {
  ///start as soon as user open a browser
  getData(ws);
  cycle = setInterval(getData, 30 * 1000, ws); // every ~30 sec; comment this line if you want getData to be executed only once
  sendData(ws, {
    info: "cycle started"
  });
}

function sendData(ws, data) {
  const message_str = JSON.stringify(data);
  if (ws) {
    ws.send(message_str);
  } else {
    console.log(message_str);
  }
}
async function getData(ws) {
  console.log("Tick " + storage.tick + " - " + symbol + " - " + new Date());
  sendData(ws, {
    exec: "info",
    data: "Tick " + storage.tick + " - " + symbol + " - " + new Date()
  });
  /* test error
    if (storage.tick == 2) {
        sendData(ws, {
            "exec": "error",
            "data": 'error ' + new Date()
        });
    }
    */
  process.on("uncaughtException", e => {
    console.log(e);
    ws.send(ws, {
      exec: "error",
      data: e
    });
  });
  process.on("unhandledRejection", e => {
    console.log(e);
    ws.send(ws, {
      exec: "error",
      data: e
    });
  });

  let [assets_name, currency_name] = symbol.split("/");
  let last_price = await exchange_funct.get_last_price(exchange, symbol);
  //    last_price = parseFloat(last_price);
  if (last_price) {
    //    console.log("Initial price:", last_price);
  }
  let balanceinfo = await exchange_funct.get_balance(exchange);
  if (balanceinfo) {
    //    console.log(balanceinfo);
    sendData(ws, {
      exec: "balance",
      data: balanceinfo
    });
    let curr_availabe,
      assets_available = 0;
    for (const key in balanceinfo) {
      if (balanceinfo.hasOwnProperty(key)) {
        const element = balanceinfo[key];
        if (element.Currency === currency_name) {
          curr_availabe = element.Available;
        } else if (element.Currency === assets_name) {
          assets_available += element.Available;
        }
      }
    }
    let assets_in_carrency = assets_available * last_price;
    storage.inibalance = assets_in_carrency;
    let balance =
      curr_availabe +
      "(" +
      currency_name +
      ") + " +
      assets_available +
      "(" +
      assets_name +
      ") = " +
      assets_in_carrency +
      "(" +
      currency_name +
      ")";
    storage.inibalance_as_string = balance;
    //    console.log("Initial balance:", storage.inibalance_as_string);
  }

  let ins = {
    low: [],
    high: [],
    open: [],
    close: [],
    volume: [],
    at: []
  };
  ins = await exchange_funct.get_ins(exchange, symbol, "1m");
  // if (ins) {
  //     for (const key in ins.at) {
  //         console.log(key, moment(ins.at[key]).format("DD-MM-YYYY HH:mm"), ins.open[key], ins.high[key], ins.low[key], ins.close[key], ins.volume[key])
  //     }
  // }
  let orderbook = await exchange_funct.get_orderBook(exchange, symbol, 20);
  sendData(ws, {
    exec: "orderbook",
    data: orderbook
  });

  let marketHistory = await exchange_funct.get_MarketHist(exchange, symbol, 10); //symbol, since = undefined, limit = undefined, params = {}
  // console.log('history', marketHistory);
  sendData(ws, {
    exec: "marketHistory",
    data: marketHistory
  });
  let openOrders = await exchange_funct.get_openOrders(exchange, symbol);
  //  console.log("open orders:", openOrders);
  sendData(ws, {
    exec: "openOrders",
    data: openOrders
  });
  let closedOrders = await exchange_funct.get_closedOrders(exchange, symbol);
  //  console.log("closed orders:", closedOrders);
  sendData(ws, {
    exec: "closedOrders",
    data: closedOrders
  });
  /*
  let msg;
  let lastorderbook = await exchange_funct.get_orderBook(exchange, symbol, 1);
  let last_bid = lastorderbook.bids[0][0];
  let last_bid_vol = lastorderbook.bids[0][1];
  let last_ask = lastorderbook.asks[0][0];
  let last_ask_vol = lastorderbook.asks[0][1];
  if (
    (last_bid != prev_last_bid ||
      last_ask != prev_last_ask ||
      last_bid_vol != prev_last_bid_vol ||
      last_ask_vol != prev_last_ask_vol) &&
    storage.tick > 0
  ) {

    let last_order = await exchange_funct.get_MarketHist(exchange, symbol, 1);
    msg =
      last_order[0].time +
      "," +
      last_order[0].side +
      "," +
      last_order[0].price +
      "," +
      last_order[0].amount +
      "\n";
    console.log(msg);
    fs.appendFile(filename, msg, function(err) {
      if (err) throw err;
    });

    msg =
      moment(new Date()).format("HH:mm:ss") +
      "," +
      last_bid +
      "," +
      last_bid_vol +
      "," +
      last_ask +
      "," +
      last_ask_vol +
      "\n";
    console.log(msg);
    fs.appendFile(filename, msg, function(err) {
      if (err) throw err;
    });
    prev_last_bid = last_bid;
    prev_last_bid_vol = last_bid_vol;
    prev_last_ask = last_ask;
    prev_last_ask_vol = last_ask_vol;
  }

  let data = await exchange_funct.get_MarketHist(exchange, symbol, 1000);
  for (let i = 0; i < data.length; i++) {
    let msg =
      data[i].time +
      "," +
      data[i].side +
      "," +
      data[i].price +
      "," +
      data[i].amount +
      "\n";
    fs.appendFile(filename, msg, function(err) {
      if (err) throw err;
    });
  }
*/
  storage.tick++;
}
//getData();
module.exports = {
  setTicker: setTicker,
  startCycle: startCycle,
  stopCycle: stopCycle,
  sendData: sendData
};
