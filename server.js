const {spawn} = require('child_process');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  httpCompression: true,
  pingInterval: 3000,
  pingTimeout: 2000
});
const cv = require('opencv4nodejs');

const {forceLogout} = require('./api');

const showUsedMemory = () => 
  process.memoryUsage().heapUsed;

const wCap= new cv.VideoCapture(0);
const FPS = 15;
wCap.set(cv.CAP_PROP_FRAME_WIDTH, 320);
wCap.set(cv.CAP_PROP_FRAME_HEIGHT, 240);

server.listen(5000);

const memStore = {
  sessionId: null,
  socketId: null
}

const workers = {
  webcamInterval: null,
  memoryUsedInterval: null,
  temperature: null
}

require('./routing')(app, io, memStore);

io.of('webcam').on('connect', socket => {
  if (!memStore.socketId) {
    memStore.socketId = socket.id;

    workers.webcamInterval = setInterval(() => {
      let frame = wCap.read();
      if (frame.empty) {
        wCap.reset();
        frame = wCap.read();
      }
      const image = cv.imencode('.jpg', frame).toString('base64');
      socket.emit('image', image);
    }, 1000 / FPS);
    
    workers.memoryUsedInterval = setInterval(() => {
      const memoryUsed = showUsedMemory();
      socket.emit('memoryUsed', memoryUsed);
    }, 500);
    
    workers.temperature = spawn('./cpu_temp');
    
    workers.temperature.stdout.on('data', data => {
      socket.emit('temperature', data);
    });
    
    workers.temperature.stderr.on('data', data => {
      console.log(data);
    })
    
    workers.temperature.on('close', code => console.log('temperature script exited with code ', code));
  
    socket.on('disconnect', async reason => {
      if (reason === 'transport close' && memStore.sessionId) {
        try {
          const json = await forceLogout(memStore.sessionId);
          if (json.status) {
            memStore.sessionId = null;
          } else {
            console.log(json.error);
          }
        }
        catch(error) {
          console.log(error);
        }
      }
      clearInterval(workers.webcamInterval);
      clearInterval(workers.memoryUsedInterval);
      workers.temperature.kill();
      memStore.socketId = null;
    })
  }
});