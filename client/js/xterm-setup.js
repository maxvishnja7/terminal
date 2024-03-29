document.addEventListener('DOMContentLoaded', function () {
    const term = new Terminal();
    term.open(document.getElementById('terminal'));
    term.write('EC2 Terminal\r\n');

    const param1 = window.location.search;

    const wsUrl = 'wss://'+window.location.host+':8443/'+param1; // Замените на свой WebSocket сервер

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

