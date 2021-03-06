const app = require('express')();
const http = require('http')
const server = http.createServer(app);
const io = require('socket.io')(server, {
  pingInterval: 5000,
  pingTimeout: 3000,
  perMessageDeflate: false
});

const {getWebcamStatus} = require('./utils');

const {obsAddress, obsPassword} = require('./config');

server.listen(5100);

const memStore = {
  sessionId: null,
  socketId: null,
  code: null,
  accessToken: null,
  refreshToken: null,
  authorized: false,
  liveBroadcastId: null,
  OBSWebSocketConnected: false,
  OBSWebSocketAuthenticated: false,
  streaming: false
};

const OBSWebSocket = require('obs-websocket-js');

const obs = new OBSWebSocket();

obs.connect({
  address: obsAddress,
  password: obsPassword
})
  .catch(error => console.log(error));

obs.on('ConnectionOpened', () => {
  memStore.OBSWebSocketConnected = true;
  console.log('obs connected');
  io.of('webcam').emit('webcamStatus', getWebcamStatus(memStore))
});

obs.on('ConnectionClosed', () => {
  memStore.OBSWebSocketConnected = false;
  io.of('webcam').emit('webcamStatus', getWebcamStatus(memStore));
});

obs.on('AuthenticationFailure', data => {
  console.log('OBS Auth Failed');
  console.log(data);
  memStore.OBSWebSocketAuthenticated = false;
  io.of('webcam').emit('webcamStatus', getWebcamStatus(memStore));
});

obs.on('AuthenticationSuccess', data => {
  console.log('OBS Auth Ok');
  memStore.OBSWebSocketAuthenticated = true;
  io.of('webcam').emit('webcamStatus', getWebcamStatus(memStore));
});

const {oauth2Client, youtubeClient} = require('./youtube-client')(memStore, io);

require('./routing')(app, io, memStore, youtubeClient, obs);
require('./googleapi-routing')(app, io, memStore, oauth2Client, youtubeClient, obs);
require('./webcam-client-routing')(app, io, memStore, youtubeClient, obs);

