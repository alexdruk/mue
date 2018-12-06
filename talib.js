const talib = require("talib");
const mfi = function (high, low, close, volume, lag, period) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "MFI",  
            high: high,
            low: low,
            close: close,
            volume: volume,
            startIdx: 0,
            endIdx: high.length - lag,
            optInTimePeriod: period
        }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result.outReal);         
            }
        });
    });
};//mfi
const bb = function (close, lag, period,  NbDevUp, NbDevDn, MAType){
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "BBANDS",  
            inReal: close,
            startIdx: 0,
            endIdx: close.length - lag,
            optInTimePeriod: period,
            optInNbDevUp: NbDevUp,
            optInNbDevDn: NbDevDn,
            optInMAType: MAType
              }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result);
//               console.log (result.result.outRealUpperBand)            
            }
        });
    });
};
const rsi = function (close, lag, period) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "RSI",  
            inReal: close,
            startIdx: 0,
            endIdx: close.length - lag,
            optInTimePeriod: period
        }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result.outReal);            
            }
        });
    });
};//rsi
const std = function (close, lag, period, optInNbDev=1) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "STDDEV",  
            inReal: close,
            startIdx: 0,
            endIdx: close.length - lag,
            optInTimePeriod: period,
            optInNbDev: optInNbDev
        }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result.outReal);            
            }
        });
    });
};//std
const ema = function (close, lag, period) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "EMA",  
            inReal: close,
            startIdx: 0,
            endIdx: close.length - lag,
            optInTimePeriod: period,
        }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result.outReal);            
            }
        });
    });
};//ema
const macd = function (close, lag, FastPeriod, SlowPeriod, SignalPeriod) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "MACD",  
            inReal: close,
            startIdx: 0,
            endIdx: close.length - lag,
            optInFastPeriod: FastPeriod,
            optInSlowPeriod: SlowPeriod,
            optInSignalPeriod: SignalPeriod
        }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result);            
            }
        });
    });
};//macd
const sar = function (high, low, lag, optInAcceleration, optInMaximum) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "SAR",  
            high: high,
            low: low,
            startIdx: 0,
            endIdx: high.length - lag,
            optInAcceleration: optInAcceleration,
            optInMaximum: optInMaximum
        }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result.outReal);            
            }
        });
    });
};//sar

const stoch_rsi = async function (close, lag, _RSI_period, _STOCH_period) {
        let stochResults = [];
        for (let n = _STOCH_period; n > 1; n--) {
            let rsiResults =  await rsi(close, n, _RSI_period).catch(err => {console.log(err)});
            let rsi_last   = rsiResults.pop();
            let sliced = rsiResults.slice(-_STOCH_period);
            let highest    = Math.max(...sliced)
            let lowest     = Math.min(...sliced)
            let stoch_rsi  =   100 * (rsi_last - lowest) / (highest - lowest)
            stochResults.push(stoch_rsi);
        }
        return stochResults.pop();            

};//stoch_rsi

const stoch = function (high,low,close,lag,fastK_period,slowK_period) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "STOCH",  
            high: high,
            low: low,
            close: close,
            startIdx: 0,
            endIdx: close.length - lag,
            optInFastK_Period: fastK_period,
            optInSlowK_Period: slowK_period,
            optInSlowK_MAType: 0,
            optInSlowD_Period: 3,
            optInSlowD_MAType: 0
        }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result.outSlowK);            
            }
        });
    });
};//stoch

const fstoch = function (high, low, close, lag, fastK_period,fastD_period) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "STOCHF",  
            high: high,
            low: low,
            close: close,
            startIdx: 0,
            endIdx: close.length - lag,
            optInFastK_Period: fastK_period,
            optInFastD_Period: fastD_period,
            optInFastD_MAType: 0
        }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result.outFastK);            
            }
        });
    });
};//fast-stoch

module.exports = {
    mfi: mfi,
    bb:bb,
    rsi:rsi,
    macd:macd,
    std:std,
    ema:ema,
    sar:sar,
    stoch:stoch,
    fstoch:fstoch,
    stoch_rsi:stoch_rsi
};