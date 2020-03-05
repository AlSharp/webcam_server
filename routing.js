const path = require('path');
const {getSessionStatus} = require('./api');
const WHITELISTED_DOMAINS = require('./config').whitelistedDomains;
const bodyParser = require('body-parser');
const cors = require('cors');

module.exports = (app, io, memStore) => {
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

  app.get('/', async (req, res) => {
    if (memStore.sessionId || memStore.socketId) {
      res.end('Webcam is busy');
    } else {
      if (req.query) {
        const json = await getSessionStatus(req.query.sessionId, 'open');
        if (json.status) {
          memStore.sessionId = req.query.sessionId;
          res.sendFile(path.join(__dirname, 'index.html'));
        } else {
          res.end('Did not find webcam session. Please log in');
        }
      }
    }
  });

  app.post('/api/end_session', async (req, res) => {
    const {sessionId} = req.body;
    if(memStore.sessionId === sessionId) {
      const json = await getSessionStatus(sessionId, 'close');
      if (json.status) {
        memStore.sessionId = null;
        io.of('webcam').emit('endSession');
        res.write(JSON.stringify({status: true}));
        res.end();
      } else {
        res.write(JSON.stringify({status: false}));
        res.end();  
      }
    } else {
      res.write(JSON.stringify({status: false}));
      res.end();
    }
  })
}