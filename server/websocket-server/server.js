const fs = require('fs');
const WebSocket = require('ws');
const { Client } = require('ssh2');
const { parse } = require('url');
const redis = require('redis');
const https = require('https');

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


//Создание клиента Redis
const redisClient = redis.createClient({
  host: '127.0.0.1', // или URL вашего сервера Redis
  port: 6379 // стандартный порт Redis
});


redisClient.on('error', (err) => {
  console.log('Ошибка Redis:', err);
});

async function setRedis(key, value) {
  try {
    await redisClient.connect();

    // Установка значения
    await redisClient.set(key, value);


  } catch (err) {
    console.error(err);
  } finally {
    await redisClient.quit();
  }
}

async function getRedis(key) {
  try {
    await redisClient.connect();

    // Установка значения
    return await redisClient.get(key);

  } catch (err) {
    console.error(err);
  } finally {
    await redisClient.quit();
  }
}

const wss = new WebSocket.Server({ noServer: true });

//HTTPS сервер для обработки GET запросов
httpsServer.on('request', (req, res) => {
  const urlParts = parse(req.url, true);

  //console.log(urlParts);

if (req.method === 'GET' && urlParts.pathname === '/set-data') {
  const query = urlParts.query;

  if (query.host && query.username) {
    // Обновление данных для SSH подключения
    // sshConfig = {
    //   host: query.host,
    //   port: query.port || 22, // Используем предоставленный порт или значение по умолчанию
    //   username: query.username,
    //   privateKey: fs.readFileSync(query.privateKeyPath || '/var/www/lab-max/ssh/ssh-phpseclib.pem') // Путь к ключу
    // };



    setRedis(query.uuid,req.url);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Все норм' }));
  } else {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Необходимы параметры host и username' }));
  }
}
else {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}
});

httpsServer.on('upgrade', (req, socket, head) => {

  const urlParts = parse(req.url, true);

  //console.log(urlParts);

  if(req.method === 'GET' && urlParts.pathname === '/') {

  let globalData = null;

  const query = urlParts.query;

  console.log(query.uuid);

  if(query.uuid == ''){
    socket.destroy();
    return;
  }

  getRedis(query.uuid)
    .then(
      value => {
      if(value == null) {
        socket.destroy();
        return;
    }

    globalData = parse(value, true);

    sshConfig = {
      host: globalData.query.host,
      port: globalData.query.port || 22, // Используем предоставленный порт или значение по умолчанию
      username: globalData.query.username,
      privateKey: fs.readFileSync(globalData.query.privateKeyPath || '/var/www/lab-max/ssh/ssh-phpseclib.pem') // Путь к ключу
    };
})
.catch(err => {
  console.error("Ошибка:", err)
  socket.destroy();
});
}

wss.handleUpgrade(req, socket, head, (ws) => {
  wss.emit('connection', ws, req);
});

});

//const wss = new WebSocket.Server({ server: httpsServer });

wss.on('connection', function connection(ws, req) {
    console.log('Новое соединение WebSocket');

    if (!sshConfig.host || !sshConfig.username) {
        console.log('Ошибка: Необходимо обновить данные SSH подключения1.');
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

