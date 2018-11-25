"use strict";

const ccxt = require("ccxt");
const creds = require("./api_keys.js");
const exchange_funct = require("./exchange_funct.js");
const WebSocket = require("ws");
const exchangeId = "bittrex";
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

//-----------------------------------------------------------------------------
let symbol = "MUE/BTC"; // default
let cycle;

//getData();
//startCycle();

function setTicker(ws, ticker) {
  symbol = ticker;
  getData(ws);
}

function stopCycle() {
  if (cycle) {
    //    clearInterval(cycle);
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
  console.log("Running", new Date());
  sendData(ws, {
    exec: "info",
    data: "Tick " + storage.tick + " - " + new Date()
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
    console.log("Initial price:", last_price);
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
    console.log("Initial balance:", storage.inibalance_as_string);
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
  let orderbook = await exchange_funct.get_orderBook(exchange, symbol);
  sendData(ws, {
    exec: "orderbook",
    data: orderbook
  });

  let marketHistory = await exchange_funct.getMarketHist(exchange, symbol); //symbol, since = undefined, limit = undefined, params = {}
  // console.log('history', marketHistory);
  sendData(ws, {
    exec: "marketHistory",
    data: marketHistory
  });
  let openOrders = await exchange_funct.get_openOrders(exchange, symbol);
  console.log("open orders:", openOrders);
  sendData(ws, {
    exec: "openOrders",
    data: openOrders
  });
  storage.tick++;
}
//getData();
module.exports = {
  setTicker: setTicker,
  startCycle: startCycle,
  stopCycle: stopCycle,
  sendData: sendData
};
