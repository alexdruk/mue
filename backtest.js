const _MFI_lower_treshold = 20;
const _MFI_upper_treshold = 80;
const _RSI_lower_treshold = 30;
const _RSI_upper_treshold = 70;
const _STOCHRSI_lower_treshold = 5;
const _STOCHRSI_upper_treshold = 95;
const _STOCH_lower_treshold = 20;
const _STOCH_upper_treshold = 85;
const _fSTOCH_lower_treshold = 1;
const _fSTOCH_upper_treshold = 99;
const _s_macd_lower_treshold = -50;
const _s_macd_upper_treshold = 80;

module.exports = {
  storageIni: function(storage) {
    storage.last_buy = 0;
    storage.curr_avalable = 0;
    storage.pl = 0;
    storage.last_sell = 0;
    storage.buys = 0;
    storage.sells = 0;
    storage.up = 0; // for consequent indicarors, like RSI
    storage.down = 0;
    storage.orders = [];
    storage.last_buy_order_id = "";
  },
  bbsar: function(close, bbUpperBand, bbLowerBand, std, sar, storage, fee) {
    let price = close;
    if (storage.buys === 0 && storage.sells === 0) {
      storage.curr_avalable = 100000;
    }
    let do_trade = true;
    let stoploss = false;
    if (sar > price) {
      do_trade = false;
    }
    if (storage.last_buy && sar <= price) {
      stoploss = true;
    }
    //buy
    if (price < bbLowerBand - std && storage.curr_avalable && do_trade) {
      storage.last_buy = price;
      storage.curr_avalable = 0;
      storage.last_sell = 0;
      storage.buys++;
    }
    //sell
    if (
      (price > bbUpperBand + std &&
        storage.last_buy &&
        price > storage.last_buy &&
        do_trade) ||
      stoploss
    ) {
      storage.last_sell = price;
      storage.curr_avalable = storage.last_buy;
      storage.sells++;
      storage.pl += ((price - storage.last_buy) * 100) / storage.last_buy - fee;
      storage.last_buy = 0;
    }
  } //bbsar
}; //module
