const {obsStartStreaming, obsStopStreaming} = require('./obs');
const {getWebcamStatus, wait} = require('./utils');

module.exports = (app, io, memStore, oauth2Client, youtubeClient, obs) => {
  app.get('/auth_status', (req, res) => {
    res.write(JSON.stringify({error: null, data: {status: memStore.authorized}}));
    res.end();
  })

  app.post('/store_auth_code', async (req, res) => {
    try {
      memStore.code = req.body.code;
      await oauth2Client.getToken(memStore.code);
      res.write(JSON.stringify({error: null, data: null}));
      res.end();
    }
    catch(error) {
      res.write(JSON.stringify({error: 'Could not get tokens'}));
      res.end();
    }
  });

  app.get('/broadcasts', async (req, res) => {
    try {
      if (memStore.authorized) {
        const liveBroadcasts = await youtubeClient.liveBroadcasts.list({
          part: ['snippet,contentDetails,status'],
          broadcastType: 'all',
          mine: true
        });
    
        res.write(JSON.stringify({
          error: null, data: {broadcasts: liveBroadcasts.data.items}
        }, null, '\t'));
      } else {
        res.write(JSON.stringify({error: 'not authorized'}))
      }
      res.end();
    }
    catch(error) {
      res.write(JSON.stringify({error: 'could not get list of broadcasts'}));
      res.end();
    }
  });

  app.get('/delete_broadcast', async (req, res) => {
    try {
      if (memStore.authorized) {
        const id = req.query.id;
        await youtubeClient.liveBroadcasts.delete({id});
        res.end(`broadcast with id ${id} has been deleted`);
      } else {
        throw new Error('app is not authorized');
      }
    }
    catch(error) {
      res.end(error.message);
    }
  });

  app.post('/start_livebroadcast', async (req, res) => {
    try {
      const liveBroadcast = await youtubeClient.liveBroadcasts.insert({
        part: ['snippet,contentDetails,status'],
        resource: {
          snippet: {
            title: 'IMAC WEBCAM LIVE',
            scheduledStartTime: new Date()
          },
          contentDetails: {
            enableAutoStart: true,
            enableAutoStop: true,
            enableLowLatency: false,
            latencyPreference: 'ultralow'
          },
          status: {
            privacyStatus: 'public'
          }
        }
      });
      const liveBroadcastId = liveBroadcast.data.id;

      memStore.liveBroadcastId = liveBroadcastId;

      const streams = await youtubeClient.liveStreams.list({
        part: ['snippet,cdn,contentDetails,status'],
        mine: true
      });
      const liveStreamId = streams.data.items[0].id;

      await youtubeClient.liveBroadcasts.bind({
        id: liveBroadcastId,
        part: ['snippet'],
        streamId: liveStreamId
      });

      await obsStartStreaming(obs);

      memStore.streaming = true;

      await wait(8000);

      io.of('webcam').emit('webcamStatus', getWebcamStatus(memStore))
      
      res.write(JSON.stringify({
        error: null, data: null
      }));
      res.end();
    }
    catch(error) {
      console.log('ERR: ', error);
      res.write(JSON.stringify({error: 'Failed to start live stream'}));
      res.end();
    }
  });

  app.post('/stop_livebroadcast', async (req, res) => {
    try {
      if (memStore.liveBroadcast) {
        await youtubeClient.liveBroadcasts.delete({
          id: memStore.liveBroadcastId
        });
        res.write(JSON.stringify({
          error: null, data: {
            message: `Livebroadcast with id ${memStore.liveBroadcastId} deleted`
          }
        }));
        memStore.liveBroadcastId = null;
      } else {
        res.write(JSON.stringify({
          error: null, data: {
            message: `Nothing to delete: id = null`
          }
        }));
      }
      res.end();
    }
    catch(error) {
      console.log('ERR: ', error);
      res.write(JSON.stringify({error: 'Failed to stop live stream'}));
      res.end();
    }
  });
}