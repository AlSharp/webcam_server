const {google} = require('googleapis');
const {CLIENT_ID, CLIENT_SECRET} = require('./secrets/oauth2');
const {getWebcamStatus} = require('./utils');

module.exports = (memStore, io) => {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'postmessage'
  );
  
  oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/youtube.readonly'
    ]
  });

  oauth2Client.on('tokens', tokens => {
    console.log('tokens: ', tokens);
    if (tokens.refresh_token) {
      memStore.refreshToken = tokens.refresh_token;
      oauth2Client.setCredentials(tokens);
    }
    memStore.accessToken = tokens.access_token;
    memStore.authorized = true;
    io.of('webcam').emit('webcamStatus', getWebcamStatus(memStore));
  });

  const youtubeClient = google.youtube({
    version: 'v3',
    auth: oauth2Client
  });

  return {
    oauth2Client, youtubeClient
  }
}