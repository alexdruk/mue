"use strict";

const ccxt = require('ccxt');
//const ex = 'bittrex';
//const log = require('ololog').configure({
//    locate: false
//});
const creds = require('./api_keys.js');
const exchange_funct = require('./exchange_funct.js');
require('ansicolor').nice;
const moment = require('moment');
const WebSocket = require('ws');
const exchangeId = 'bittrex';
const exchangeClass = ccxt[exchangeId];
const exchange = new ccxt.bittrex({
    'apiKey': creds.apiKey,
    'secret': creds.secret,
    'timeout': 30000,
    'enableRateLimit': true,
    'verbose': false,
});

//-----------------------------------------------------------------------------
let symbol = 'MUE/BTC'; // default
let cycle;
//getData();
//startCycle();

function setTicker(ws, ticker) {
    symbol = ticker;
    getData(ws);
}

function stopCycle() {
    if (cycle) {
        clearInterval(cycle);
        cycle = null;
    }
};

function startCycle(ws) { ///start as soon as user open a browser
    getData(ws);
    cycle = setInterval(getData, 30 * 1000, ws); // every ~30 sec
    sendData(ws, {
        "info": "cycle started"
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
    console.log('Running', new Date());
    sendData(ws, {
        "info": "getData started"
    });

    let storage = {
        inibalance: 0,
        inibalance_as_string: '',
    };
    process.on('uncaughtException', e => {
        console.log(e);
        /*        ws.send(JSON.stringify({
                    "exec": "error",
                    "data": e
                }));
        */
    });
    process.on('unhandledRejection', e => {
        console.log(e);
        /*        ws.send(JSON.stringify({
                    "exec": "error",
                    "data": e
                }));
        */
    });
    let [assets_name, currency_name] = symbol.split('/');
    let last_price = await exchange_funct.get_last_price(exchange, symbol);
    //    last_price = parseFloat(last_price);
    if (last_price) {
        console.log('Initial price:', last_price);
    }
    let balanceinfo = await exchange_funct.get_balance(exchange);
    if (balanceinfo) {
        /*    ws.send(JSON.stringify({
                "exec": "balance",
                "data": balanceinfo
            }));
        */
        console.log(balanceinfo);
        let curr_availabe, assets_available = 0;
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
        let balance = curr_availabe + '(' + currency_name + ') + ' + assets_available + '(' + assets_name + ') = ' + assets_in_carrency + '(' + currency_name + ')';
        storage.inibalance_as_string = balance;
        console.log('Initial balance:', storage.inibalance_as_string);
    }

    let ins = {
        low: [],
        high: [],
        open: [],
        close: [],
        volume: [],
        at: []
    };
    ins = await exchange_funct.get_ins(exchange, symbol, '1m');

    if (ins) {
        for (const key in ins.at) {
            //            console.log(key, moment(ins.at[key]).format("DD-MM-YYYY HH:mm"), ins.open[key], ins.high[key], ins.low[key], ins.close[key], ins.volume[key])
        }
    }
    const orderbook = await exchange_funct.get_orderBook(exchange, symbol);

    sendData(ws, {
        "exec": "orderbook",
        "data": orderbook
    });

    console.log(orderbook); //bids:[price,size.toFixed(3), asks:[price,size.toFixed(3)]
    //    process.exit();

    //};
};
module.exports = {
    setTicker: setTicker,
    startCycle: startCycle,
    stopCycle: stopCycle
}