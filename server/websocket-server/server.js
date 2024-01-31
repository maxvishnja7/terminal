const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const { Client } = require('ssh2');
const { parse } = require('url');

// Укажите пути к вашему SSL-сертификату и приватному ключу
const privateKey = fs.readFileSync('/etc/letsencrypt/live/lab-max.cloudvert.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/lab-max.cloudvert.com/fullchain.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials);

// Объект для хранения данных SSH подключения в памяти
let sshConfig = {
    host: '',
    port: 22, // Значение по умолчанию, может быть изменено
    username: '',
    privateKey: fs.readFileSync('/var/www/lab-max/ssh/ssh-phpseclib.pem') // Путь к ключу по умолчанию
};

httpsServer.listen(8443, '0.0.0.0', () => {
    console.log('HTTPS и WebSocket сервер запущен на IPv4 интерфейсах порта 8443');
});

const wss = new WebSocket.Server({ server: httpsServer });

// HTTPS сервер для обработки GET запросов
httpsServer.on('request', (req, res) => {
  const urlParts = parse(req.url, true);

if (req.method === 'GET' && urlParts.pathname === '/') {
  const query = urlParts.query;
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: query }));
  if (query.host && query.username) {
    // Обновление данных для SSH подключения
    sshConfig = {
      host: query.host,
      port: query.port || 22, // Используем предоставленный порт или значение по умолчанию
      username: query.username,
      privateKey: fs.readFileSync(query.privateKeyPath || '/var/www/lab-max/ssh/ssh-phpseclib.pem') // Путь к ключу
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'SSH информация обновлена' }));
  } else {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Необходимы параметры host и username' }));
  }
} else {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}
});

wss.on('connection', function connection(ws) {
    console.log('Новое соединение WebSocket');

    if (!sshConfig.host || !sshConfig.username) {
        console.log('Ошибка: Необходимо обновить данные SSH подключения.');
        ws.close();
        return;
    }

    const ssh = new Client();
    ssh.on('ready', function() {
        console.log('SSH соединение установлено');
        ssh.shell(function(err, stream) {
            if (err) {
                return ws.close();
            }

            ws.on('message', function(message) {
                stream.write(message);
            });

            stream.on('data', function(data) {
                ws.send(data.toString('utf8'));
            }).on('close', function() {
                ssh.end();
            });
        });
    }).on('close', function() {
        console.log('SSH соединение закрыто');
        ws.close();
    }).on('error', function(err) {
        console.log('Ошибка SSH: ', err);
        ws.close();
    });

    ssh.connect(sshConfig);
});
