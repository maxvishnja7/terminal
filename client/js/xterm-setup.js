document.addEventListener('DOMContentLoaded', function () {
    const term = new Terminal();
    term.open(document.getElementById('terminal'));
    term.write('EC2 Terminal\r\n');


    const queryParams = new URLSearchParams(window.location.search);
    const param1 = queryParams.get('param1');

    const wsUrl = 'wss://lab-max.cloudvert.com:8443/?uuid='+param1; // Замените на свой WebSocket сервер
  console.log(wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = function() {
        term.onData(function(data) {
            ws.send(data);
        });
    };

    ws.onmessage = function(evt) {
        term.write(evt.data);
    };

    ws.onclose = function(evt) {
        term.write('\r\nConnection closed: ' + evt.reason);
    };

    ws.onerror = function(evt) {
        term.write('\r\nWebSocket error');
    };
});

