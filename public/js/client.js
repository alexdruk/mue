// Create WebSocket connection.
const socket = new WebSocket('ws://localhost:8081');

// Connection opened

socket.addEventListener('open', function (event) {
    //  socket.send('Hello Server!');
    console.log('Socket opened');
});

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
    $('#error_body').collapse('hide'); //?????
    let parsedData = JSON.parse(event.data);
    switch (parsedData.exec) {
        case 'orderbook':
            let orderbook_body = document.getElementById('orderbook_body');
            orderbook_body.innerHTML = buldOrderbook(parsedData.data);
            break;
        case 'balance':
            let balance_body = document.getElementById('balance_body');
            balance_body.innerHTML = builBalance(parsedData.data);
            break;
        case 'error':
            let error_body = document.getElementById('error_body');
            $('#error_body').collapse('show');
            error_body.innerText = parsedData.data;
            break;
        case 'info':
            let info_body = document.getElementById('info_body');
            info_body.innerText = parsedData.data;
            break;
        case "marketHistory":
            let mhist = document.getElementById('mhist_body');
            mhist.innerHTML = builMarketHistory(parsedData.data);
            break;

    }

});
socket.addEventListener('close', function (event) {
    console.log('Socket closed');
});

function builMarketHistory(data) {
    let html = '';
    let side = ''
    for (let i = 0; i < data.length; i++) {
        if (data[i].side == 'buy') {
            side = '<td class = "green_td">' + data[i].side + '</td>'
        } else {
            side = '<td class = "red_td">' + data[i].side + '</td>'
        }
        html += '<tr>' +
            '<td>' + data[i].time + '</td>' +
            '<td>' + data[i].type + '</td>' +
            side +
            '<td>' + data[i].price + '</td>' +
            '<td>' + data[i].amount + '</td>' +
            '<td>' + data[i].cost + '</td>' +
            '</tr>';
    }
    return html;
}

function buldOrderbook(data) {
    let bids = data.bids;
    let asks = data.asks;
    let html = '';
    for (let i = 0; i < bids.length; i++) {
        html += '<tr>' +
            '<td>' + (bids[i][0] * bids[i][1]).toFixed(4) + '</td>' +
            '<td>' + bids[i][1].toFixed(3) + '</td>' +
            '<td class = "green_td">' + bids[i][0].toFixed(8) + '</td>' +
            '<td>|</td>' +
            '<td class = "red_td">' + asks[i][0].toFixed(8) + '</td>' +
            '<td>' + asks[i][1].toFixed(3) + '</td>' +
            '<td>' + (asks[i][0] * asks[i][1]).toFixed(4) + '</td>' +
            '</tr>';
    }
    return html;
}

function builBalance(data) {
    let html = '';
    for (let i = 0; i < data.length; i++) {
        html += '<tr>' +
            '<td>' + data[i].Currency + '</td>' +
            '<td>' + data[i].Balance + '</td>' +
            '<td>' + data[i].Available + '</td>' +
            '<td>' + data[i].Pending + '</td>' +
            '</tr>';
    }
    return html;
}