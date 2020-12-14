const app = require('express')();
const http = require('http')
const server = http.createServer(app);
const io = require('socket.io')(server, {
  pingInterval: 5000,
  pingTimeout: 3000,
  perMessageDeflate: false
});

const {forceLogout} = require('./api');

server.listen(5100);

const showUsedMemory = () => 
  process.memoryUsage().heapUsed;

const memStore = {
  sessionId: null,
  socketId: null,
  code: null,
  accessToken: null,
  refreshToken: null
};

const workers = {
  memoryUsedInterval: null,
};

const {youtubeClient, googleApiRouting} = require('./googleapi')(memStore);

require('./routing')(app, io, memStore, youtubeClient);
googleApiRouting(app, io, memStore);

io.of('webcam').on('connect', socket => {
  console.log('connect socket with id ', socket.id);
  if (!memStore.socketId) {
    memStore.socketId = socket.id;
    
    workers.memoryUsedInterval = setInterval(() => {
      const memoryUsed = showUsedMemory();
      socket.emit('memoryUsed', memoryUsed);
    }, 500);
  
    socket.on('disconnect', async reason => {
      console.log('reason: ', reason);
      console.log('memStore: ', memStore);
      if (reason === 'transport close' && memStore.sessionId) {
        console.log('FORCE LOGOUT')
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
      clearInterval(workers.memoryUsedInterval);
      memStore.socketId = null;
    })
  }
});