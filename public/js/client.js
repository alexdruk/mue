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
    let parsedData = JSON.parse(event.data);
    switch (parsedData.exec) {
        case 'orderbook':
            $('#orderbook_body').innnerText(parsedData.data);
            break;
    }

});
socket.addEventListener('close', function (event) {
    console.log('Socket closed');
});