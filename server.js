const path = require('path');
const {spawn} = require('child_process');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cv = require('opencv4nodejs');

const showUsedMemory = () => 
  process.memoryUsage().heapUsed;

  if (process.argv[2] === 'with-ngrok') {
    const ngrok = require('ngrok');
    (async function() {
      const url = await ngrok.connect(5000);
      console.log(url);
    })();
  }

const wCap= new cv.VideoCapture(0);
const FPS = 12;
wCap.set(cv.CAP_PROP_FRAME_WIDTH, 640);
wCap.set(cv.CAP_PROP_FRAME_HEIGHT, 360);
//640x360

server.listen(5000);

app.use('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

let viewers = 0;

io.on('connect', socket => {
  viewers += 1;
  io.emit('viewers', viewers);
  socket.on('disconnect', () => {
    viewers -= 1;
    io.emit('viewers', viewers);
  })
});

setInterval(() => {
  let frame = wCap.read();
  if (frame.empty) {
    wCap.reset();
    frame = wCap.read();
  }
  const image = cv.imencode('.jpg', frame).toString('base64');
  io.emit('image', image);
}, 1000 / FPS);

setInterval(() => {
  const memoryUsed = showUsedMemory();
  io.emit('memoryUsed', memoryUsed);
}, 500);

const temperature = spawn('./cpu_temp');

temperature.stdout.on('data', data => {
  io.emit('temperature', data);
});

temperature.stderr.on('data', data => {
  console.log(data);
})

temperature.on('close', code => console.log('temperature script exited with code ', code));