const {forceLogout} = require('./api');
const {obsStopStreaming} = require('./obs');

module.exports = (app, io, memStore, youtubeClient, obs) => {
  io.of('webcam').on('connect', socket => {
    console.log('connect socket with id ', socket.id);
    if (!memStore.socketId) {
      memStore.socketId = socket.id;
    
      socket.on('disconnect', async reason => {
        console.log('reason: ', reason);
        if (reason === 'transport close' && memStore.sessionId) {
          try {
            await youtubeClient.liveBroadcasts.delete({id: memStore.liveBroadcastId});
            memStore.liveBroadcastId = null;
            await obsStopStreaming(obs);
            const json = await forceLogout(memStore.sessionId);
            if (json.error) {
              throw json.error;
            }
            memStore.sessionId = null;
          }
          catch(error) {
            console.log(error);
          }
        }
        memStore.socketId = null;
      })
    }
  });
}