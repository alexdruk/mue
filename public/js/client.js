// Create WebSocket connection.
let socket = new WebSocket("ws://localhost:8081");

// Connection opened

socket.addEventListener("open", function(event) {
  //  socket.send('Hello Server!');
  console.log("Socket opened");
});

// Listen for messages
socket.addEventListener("message", function(event) {
  console.log("Message from server ", event.data);
  let parsedData = JSON.parse(event.data);
  switch (parsedData.exec) {
    case "orderbook":
      let orderbook_body = document.getElementById("orderbook_body");
      orderbook_body.innerHTML = buldOrderbook(parsedData.data);
      break;
    case "balance":
      let balance_body = document.getElementById("balance_body");
      balance_body.innerHTML = buildBalance(parsedData.data);
      break;
    case "error":
      let error_body = document.getElementById("error_body");
      $("#error_body").collapse("show");
      error_body.innerText = parsedData.data;
      break;
    case "info":
      let info_body = document.getElementById("info_body");
      info_body.innerText = parsedData.data;
      break;
    case "marketHistory":
      let mhist = document.getElementById("mhist_body");
      mhist.innerHTML = buildMarketHistory(parsedData.data);
      break;
    case "openOrders":
      let open_ord = document.getElementById("openOrders_body");
      open_ord.innerHTML = buildOpenOrders(parsedData.data);
    case "closedOrders":
      let closed_ord = document.getElementById("ohist_body");
      closed_ord.innerHTML = buildClosedOrders(parsedData.data);
  }
});
socket.addEventListener("close", function(event) {
  console.log("Socket closed");
});

//set tradingView Widget
window.onload = function() {
  setTradingViewWidget("MUEBTC");
};

function sendTicker() {
  let e = document.getElementById("newTicker");
  let ticker = e.options[e.selectedIndex].text;
  let tickerTView = e.options[e.selectedIndex].value;
  setTradingViewWidget(tickerTView);
  let data = { exec: "setTicker", data: ticker };
  socket.send(JSON.stringify(data));
  console.log("Message from client: setTicker", ticker);
}

function startBacktest(btest_name) {
  let e = document.getElementById("newTicker");
  let ticker = e.options[e.selectedIndex].text;
  let dt = { name: btest_name, ticker: ticker };
  let data = { exec: "backtest", data: dt };
  socket.send(JSON.stringify(data));
  //  document.getElementById("exchange").style.visibility = "hidden";
  //   document.getElementById("backtest").disabled = true;
  console.log("Message from client: backtest", dt);
}

function buildClosedOrders(data) {
  let html = "";
  let side = "";
  for (let i = 0; i < data.length; i++) {
    if (data[i].side == "buy") {
      side = '<td class = "green_td">' + data[i].side + "</td>";
    } else {
      side = '<td class = "red_td">' + data[i].side + "</td>";
    }
    html +=
      "<tr>" +
      "<td>" +
      data[i].closed +
      "</td>" +
      "<td>" +
      data[i].open +
      "</td>" +
      side +
      "<td>" +
      data[i].price +
      "</td>" +
      "<td>" +
      data[i].filled +
      "</td>" +
      "<td>" +
      data[i].amount +
      "</td>" +
      "<td>" +
      data[i].price +
      "</td>" +
      "<td>" +
      (
        data[i].price * data[i].amount -
        data[i].price * data[i].amount * 0.0025
      ).toFixed(8) +
      "</td>" +
      "</tr>";
  }
  return html;
}
function buildOpenOrders(data) {
  let html = "";
  let side = "";
  for (let i = 0; i < data.length; i++) {
    if (data[i].side == "buy") {
      side = '<td class = "green_td">' + data[i].side + "</td>";
    } else {
      side = '<td class = "red_td">' + data[i].side + "</td>";
    }
    html +=
      "<tr>" +
      "<td>" +
      data[i].datetime +
      "</td>" +
      side +
      "<td>" +
      data[i].price +
      "</td>" +
      "<td>" +
      data[i].filled +
      "</td>" +
      "<td>" +
      data[i].amount +
      "</td>" +
      "<td>" +
      data[i].cost +
      "</td>" +
      "<td>" +
      (
        data[i].price * data[i].amount -
        data[i].price * data[i].amount * 0.0025
      ).toFixed(8) +
      "</td>" +
      "<td>" +
      data[i].status +
      "</td>" +
      "</tr>";
  }
  return html;
}

function buildMarketHistory(data) {
  let html = "";
  let side = "";
  for (let i = 0; i < data.length; i++) {
    if (data[i].side == "buy") {
      side = '<td class = "green_td">' + data[i].side + "</td>";
    } else {
      side = '<td class = "red_td">' + data[i].side + "</td>";
    }
    html +=
      "<tr>" +
      "<td>" +
      data[i].time +
      "</td>" +
      "<td>" +
      data[i].type +
      "</td>" +
      side +
      "<td>" +
      data[i].price.toFixed(8) +
      "</td>" +
      "<td>" +
      data[i].amount +
      "</td>" +
      "<td>" +
      data[i].cost +
      "</td>" +
      "</tr>";
  }
  return html;
}

function buldOrderbook(data) {
  let bids = data.bids;
  let asks = data.asks;
  let html = "";
  for (let i = 0; i < bids.length; i++) {
    html +=
      "<tr>" +
      "<td>" +
      (bids[i][0] * bids[i][1]).toFixed(4) +
      "</td>" +
      "<td>" +
      bids[i][1].toFixed(3) +
      "</td>" +
      '<td class = "green_td">' +
      bids[i][0].toFixed(8) +
      "</td>" +
      "<td>|</td>" +
      '<td class = "red_td">' +
      asks[i][0].toFixed(8) +
      "</td>" +
      "<td>" +
      asks[i][1].toFixed(3) +
      "</td>" +
      "<td>" +
      (asks[i][0] * asks[i][1]).toFixed(4) +
      "</td>" +
      "</tr>";
  }
  return html;
}

function buildBalance(data) {
  let html = "";
  for (let i = 0; i < data.length; i++) {
    html +=
      "<tr>" +
      "<td>" +
      data[i].Currency +
      "</td>" +
      "<td>" +
      data[i].Balance +
      "</td>" +
      "<td>" +
      data[i].Available +
      "</td>" +
      "<td>" +
      data[i].Pending +
      "</td>" +
      "</tr>";
  }
  return html;
}
function setTradingViewWidget(ticker) {
  let html = "";
  html +=
    '<div class="tradingview-widget-container">' +
    '<script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>' +
    '<script type="text/javascript">' +
    "new TradingView.widget(" +
    '{"width": 1100,' +
    '"height": 610,' +
    '"symbol": "BITTREX:' +
    ticker +
    '",' +
    '"interval": "1",' +
    '"timezone": "Etc/UTC",' +
    '"theme": "Dark",' +
    '"style": "1",' +
    '"locale": "en",' +
    '"toolbar_bg": "rgba(216, 216, 216, 1)",' +
    '"enable_publishing": false,' +
    '"withdateranges": true,' +
    '"allow_symbol_change": true,' +
    '"details": true' +
    "});" +
    "</script>" +
    "</div>" +
    '<div id="tradingview_d20fc-wrapper" style="position: relative;box-sizing: content-box;width: 1100px;height: 610px;margin: 0 auto !important;padding: 0 !important;font-family:Arial,sans-serif;"><div style="width: 1100px;height: 610px;background: transparent;padding: 0 !important;"><iframe id="tradingview_d20fc" src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_d20fc&amp;symbol=BITTREX%3A' +
    ticker +
    '&amp;interval=1&amp;symboledit=1&amp;saveimage=1&amp;toolbarbg=f1f3f6&amp;details=1&amp;studies=%5B%5D&amp;theme=Dark&amp;style=1&amp;timezone=Etc%2FUTC&amp;withdateranges=1&amp;studies_overrides=%7B%7D&amp;overrides=%7B%7D&amp;enabled_features=%5B%5D&amp;disabled_features=%5B%5D&amp;locale=en&amp;utm_source=localhost&amp;utm_medium=widget&amp;utm_campaign=chart&amp;utm_term=BITTREX%3AMUEBTC" style="width: 100%; height: 100%; margin: 0 !important; padding: 0 !important;" frameborder="0" allowtransparency="true" scrolling="no" allowfullscreen=""></iframe></div></div>';
  let widget = document.getElementById("tradingview");
  //  widget.insertAdjacentHTML("beforeend", html);
  widget.innerHTML = html;
}
