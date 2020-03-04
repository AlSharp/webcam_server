const path = require('path');
const {spawn} = require('child_process');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  httpCompression: true,
  pingInterval: 3000,
  pingTimeout: 2000
});
const cv = require('opencv4nodejs');

const {getSessionStatus, forceLogout} = require('./api');

const showUsedMemory = () => 
  process.memoryUsage().heapUsed;

const wCap= new cv.VideoCapture(0);
const FPS = 15;
wCap.set(cv.CAP_PROP_FRAME_WIDTH, 320);
wCap.set(cv.CAP_PROP_FRAME_HEIGHT, 240);

server.listen(5000);

const memStore = {
  sessionId: null
}

app.use('/', async (req, res) => {
  if (req.query) {
    const json = JSON.parse(await getSessionStatus(req.query.sessionId));
    if (json.status) {
      memStore.sessionId = req.query.sessionId;
      res.sendFile(path.join(__dirname, 'index.html'));
    } else {
      res.end('Did not find webcam session. Please log in');
    }
  }
});

let webcamInterval = null;
let memoryUsedInterval = null;
let temperature = null;

io.on('connect', socket => {
  webcamInterval = setInterval(() => {
    console.log('web cam capture');
    let frame = wCap.read();
    if (frame.empty) {
      wCap.reset();
      frame = wCap.read();
    }
    const image = cv.imencode('.jpg', frame).toString('base64');
    io.emit('image', image);
  }, 1000 / FPS);
  
  memoryUsedInterval = setInterval(() => {
    const memoryUsed = showUsedMemory();
    io.emit('memoryUsed', memoryUsed);
  }, 500);
  
  temperature = spawn('./cpu_temp');
  
  temperature.stdout.on('data', data => {
    io.emit('temperature', data);
  });
  
  temperature.stderr.on('data', data => {
    console.log(data);
  })
  
  temperature.on('close', code => console.log('temperature script exited with code ', code));

  socket.on('disconnect', reason => {
    if (reason === 'transport close') {
      forceLogout(memStore.sessionId)
        .then(res => {
          if (res.error) {
            console.log(res.error);
          } else {
            memStore.sessionId = null;
          }
        })
        .catch(error => console.log(error))
    }
    clearInterval(webcamInterval);
    clearInterval(memoryUsedInterval);
    temperature.kill();
  })
});