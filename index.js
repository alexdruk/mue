"use strict";

const ccxt = require("ccxt");
const creds = require("./api_keys.js");
const exchange_funct = require("./exchange_funct.js");
const talib = require("./talib.js");
const backtest_trading = require("./backtest.js");
const trading = require("./trading.js");
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
let ins = {
  low: [],
  high: [],
  open: [],
  close: [],
  volume: [],
  at: []
};
let curr_available = 0;
let assets_available = 0;
let bittrex_min_trade_amount = 0.005; //in BTC

//getData();
//startCycle();
trade(WebSocket, "bbsar", "MUE/BTC");

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
//////////////////////////////////////////////////////
async function trade(ws, strategy, ticker) {
  backtest_trading.storageIni(storage);
  const symbol = ticker;
  let bbsar_config = null;
  if (strategy == "bbsar") {
    bbsar_config = require("./bbsar_config.js");
    let price = await exchange_funct.get_last_price(exchange, symbol);
    [curr_available, assets_available] = await exchange_funct.get_account_info(
      exchange,
      symbol
    );
    // console.log(
    //   "curr_available",
    //   curr_available,
    //   "assets_available",
    //   assets_available
    // );
    // trading.strategy(ticker);
    ins = await exchange_funct.get_ins(exchange, symbol, "1m");
    let Accelerations = bbsar_config.Accelerations;
    let bb_periods = bbsar_config.bb_periods;
    let num_stds = bbsar_config.num_stds;
    let std_periods = bbsar_config.std_periods;
    let bbResults = await talib.bb(
      ins.close,
      1,
      bb_periods,
      num_stds,
      num_stds,
      0
    );
    let bbUpperBand = bbResults.outRealUpperBand.pop();
    let bbLowerBand = bbResults.outRealLowerBand.pop();
    let sarResults = await talib.sar(
      ins.high,
      ins.low,
      1,
      Accelerations,
      Accelerations * 10
    );
    let sar = sarResults.pop();
    let stdResults = await talib.std(ins.close, 1, std_periods);
    let std = stdResults.pop();
    //got indicators, start trading
    let do_trade = true;
    let stoploss = false;
    if (sar > price) {
      do_trade = false;
    }
    if (storage.last_buy && sar <= price) {
      stoploss = true;
    }
    // if (storage.last_buy_order_id) {
    //   let order = await exchange_funct.get_order_info(
    //     exchange,
    //     storage.last_buy_order_id
    //   );
    // }
    //buy
    let amount = 0;
    if (price < bbLowerBand - std && curr_available && do_trade) {
      amount = curr_available / 2;
      console.log("buy condition... Amount:", amount);
      //to make market order made price much more then current price
      if (amount * price > bittrex_min_trade_amount) {
        let buyOrder = await exchange_funct.create_order(
          exchange,
          symbol,
          "limit",
          "buy",
          amount,
          price / 2 // CHANGE TO OPPOSITE!!!! to make market order
        );
        storage.last_buy_order_id = buyOrder.id;
        storage.orders.push(buyOrder);
        storage.last_buy = price;
        storage.last_sell = 0;
        storage.buys++;
      }
    } //buy
    //sell
    if (
      (price > bbUpperBand + std &&
        storage.last_buy &&
        price > storage.last_buy &&
        do_trade) ||
      stoploss
    ) {
      amount = assets_available / 2;
      if (amount * price > bittrex_min_trade_amount) {
        let sellOrder = await exchange_funct.create_order(
          exchange,
          symbol,
          "limit",
          "sell",
          amount,
          price * 2 // CHANGE TO OPPOSITE!!!! to make market order
        );
        storage.last_buy_order_id = sellOrder.id;
        storage.orders.push(sellOrder);
        storage.last_sell = price;
        storage.sells++;
        storage.last_buy = 0;
      }
    } //sell
  } //strategy
}
//////////////////////////////////////////////////////
async function backtest(ws, backtest_name, symbol) {
  stopCycle();
  ins = await exchange_funct.get_ins(exchange, symbol, "1m");
  console.log("cycle stoped");
  console.log("Starting backtest:", backtest_name, symbol);
  sendData(ws, {
    exec: "info",
    data:
      "Starting backtest: " +
      backtest_name +
      " " +
      symbol +
      " from " +
      moment(ins.at[0]).format("DD/MM/YYYY HH:mm:ss") +
      " to " +
      moment(ins.at[ins.at.length - 1]).format("DD/MM/YYYY HH:mm:ss") +
      ". Total " +
      ins.at.length +
      " intervals. Be patient..."
  });
  console.log(
    "from ",
    moment(ins.at[0]).format("DD/MM/YYYY HH:mm:ss"),
    " to ",
    moment(ins.at[ins.at.length - 1]).format("DD/MM/YYYY HH:mm:ss")
  );
  // loop with 300 runs 3,5 min
  const trades = 5;
  let bb_sar_res = "";
  const fee = 0.5; //double bittrex fees
  const bb_sar_dataRange = {};
  const Accelerations = [0.005, 0.0025, 0.00125];
  const bb_periods = [8, 10, 12, 14, 16, 18, 20, 22];
  const num_stds = [1.0, 1.5, 2.0];
  const std_periods = [4, 6, 8, 10, 12, 14, 16, 18];
  for (const accel of Accelerations) {
    for (const bbperiod of bb_periods) {
      for (const n_stds of num_stds) {
        for (const std_period of std_periods) {
          backtest_trading.storageIni(storage);
          for (let i = 30; i < ins.at.length - 300; i++) {
            let high = ins.high.slice(i, i + 300);
            let low = ins.low.slice(i, i + 300);
            let close = ins.close.slice(i, i + 300);
            let std = await talib.std(close, 1, std_period);
            let bbResults = await talib.bb(
              close,
              1,
              bbperiod,
              n_stds,
              n_stds,
              0
            );
            let sarResults = await talib.sar(high, low, 1, accel, accel * 10);
            let bbUpperBand = bbResults.outRealUpperBand;
            let bbLowerBand = bbResults.outRealLowerBand;
            backtest_trading.bbsar(
              close.pop(),
              bbUpperBand.pop(),
              bbLowerBand.pop(),
              std.pop(),
              sarResults.pop(),
              storage,
              fee
            );
            //                    console.log('sar=', sarResults.pop())
          }
          let bb_sar_params =
            bbperiod + "#" + n_stds + "#" + std_period + "#" + accel;
          if (storage.pl > 0 && storage.sells > trades) {
            bb_sar_dataRange[bb_sar_params] = storage.pl;
            // console.log(bb_sar_params, storage.pl, new Date());
          }
        } //std_period
      } ////nstd
    } //bbperiod
  } //for accel
  if (Object.keys(bb_sar_dataRange).length > 0) {
    bb_sar_res = Object.keys(bb_sar_dataRange).reduce((a, b) =>
      bb_sar_dataRange[a] > bb_sar_dataRange[b] ? a : b
    );
    console.log(
      "Optimum for " + backtest_name + ":",
      bb_sar_res,
      "#",
      bb_sar_dataRange[bb_sar_res]
    );
  } else {
    console.log("Less than 3 trades with current bb_sar_res range");
  }
  if (bb_sar_res) {
    let [bb_period, n_stds, std_period, accel] = bb_sar_res.split("#");
    sendData(ws, {
      exec: "info",
      data:
        "Backtest finished. Optimal parameters are: bb period " +
        bb_period +
        ", n_stds " +
        n_stds +
        ", std_period " +
        std_period +
        ", acceleration " +
        accel
    });
  } else {
    sendData(ws, {
      exec: "info",
      data: "Finished: not enough data for backtest."
    });
  }
  await exchange_funct.sleep(30000); //sleep for 30 sec before continue
  startCycle(ws);
} //backtest
//////////////////////////////////////////////////////
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
    let curr_available,
      assets_available = 0;
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
    let assets_in_currency = assets_available * last_price;
    storage.inibalance = assets_in_currency;
    let balance =
      curr_available +
      "(" +
      currency_name +
      ") + " +
      assets_available +
      "(" +
      assets_name +
      ") = " +
      assets_in_currency +
      "(" +
      currency_name +
      ")";
    storage.inibalance_as_string = balance;
    // console.log("Initial balance:", storage.inibalance_as_string);
  }
  let orderbook = await exchange_funct.get_orderBook(exchange, symbol, 10);
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
  trade: trade,
  setTicker: setTicker,
  backtest: backtest,
  startCycle: startCycle,
  stopCycle: stopCycle,
  sendData: sendData
};
