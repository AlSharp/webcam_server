const {google} = require('googleapis');
const {CLIENT_ID, CLIENT_SECRET} = require('./secrets/oauth2');

module.exports = memStore => {
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
  });

  const youtubeClient = google.youtube({
    version: 'v3',
    auth: oauth2Client
  });

  return {
    youtubeClient,
    googleApiRouting: (app, io, memStore) => {
      app.post('/store_auth_code', async (req, res) => {
        memStore.code = req.body.code;
        await oauth2Client.getToken(memStore.code);
        console.log('got tokens');
        const list = await youtubeClient.liveStreams.list({
          part: ['id,snippet,contentDetails,status'], mine: true
        });
        res.write(JSON.stringify({error: null, list}));
        res.end();
      });
    }
  }
}