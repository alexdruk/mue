const express = require("express");
const path = require("path");
const WebSocket = require("ws");
const opn = require("opn");

const PORT = 8080;
const WSS_PORT = 8081;

let crypto = require("./index.js");

let app = express();

app.use(express.static(path.join(__dirname, "public")));

let wss = new WebSocket.Server({
  port: WSS_PORT
});

wss.on("connection", ws => {
  console.log("Opened");
  crypto.startCycle(ws);

  ws.on("message", mesage_string => {
    let parsedData = JSON.parse(mesage_string);
    switch (parsedData.exec) {
      case "setTicker":
        try {
          crypto.setTicker(ws, parsedData.data);
        } catch (e) {
          console.log(e);
        }
        break;
    }
  });

  ws.on("close", () => {
    crypto.stopCycle(ws);
    console.log(
      (
        "If you closed the site, please navigate to http://localhost:" +
        PORT +
        " to access it again, or press ctrl+c to stop the program"
      ).blue
    );
  });

  ws.on("error", () => {});
});
app.listen(PORT, () => {
  //opn("http://localhost:" + PORT);
});
