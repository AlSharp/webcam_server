
const express = require('express');
const path = require('path');
const {getSessionStatus} = require('./api');
const WHITELISTED_DOMAINS = require('./config').whitelistedDomains;
const bodyParser = require('body-parser');
const cors = require('cors');
const {obsStopStreaming} = require('./obs');

module.exports = (app, io, memStore, youtubeClient, obs) => {
  const corsOptions = {
    credentials: true,
    origin: (origin, cb) => {
      if (WHITELISTED_DOMAINS.indexOf(origin) !== -1 || !origin) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'));
      }
    }
  }

  app.use(cors(corsOptions));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use('/webcam_ui', express.static(__dirname + '/webcam_ui_build'));

  app.get('/', async (req, res) => {
    console.log(memStore);
    if (memStore.sessionId || memStore.socketId) {
      res.end('Webcam is busy');
    } else {
      if (req.query) {
        const json = await getSessionStatus(req.query.sessionId, 'open');
        if (json.data.status) {
          memStore.sessionId = req.query.sessionId;
          res.sendFile(path.join(__dirname, 'webcam_ui_build', 'index.html'));
        } else {
          res.end('Did not find webcam session. Please log in');
        }
      }
    }
  });

  app.use('/authorize', express.static(__dirname + '/auth_app_build'));

  app.post('/api/end_session', async (req, res) => {
    const {sessionId} = req.body;
    if(memStore.sessionId === sessionId) {
      const json = await getSessionStatus(sessionId, 'close');
      if (json.data.status) {
        memStore.sessionId = null;
        await youtubeClient.liveBroadcasts.delete({id: memStore.liveBroadcastId});
        memStore.liveBroadcastId = null;
        await obsStopStreaming(obs);
        io.of('webcam').emit('endSession');
        res.write(JSON.stringify({status: 'webcam session ended'}));
        res.end();
      } else {
        res.write(JSON.stringify({status: 'webcam session does not match'}));
        res.end();  
      }

    } else {
      res.write(JSON.stringify({status: 'webcam session does not match'}));
      res.end();
    }
  });

  app.get('/get_status', (req, res) => {
    const {
      authorized,
      OBSWebSocketConnected,
      OBSWebSocketAuthenticated
    } = memStore;
    res.write(JSON.stringify({
      authorized,
      obsReady: OBSWebSocketConnected,
      obsAuthReady: OBSWebSocketAuthenticated
    }));
    res.end();
  })
}