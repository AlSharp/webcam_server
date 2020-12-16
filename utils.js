exports.getImacHostName = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('imac-dev');
    return 'imac-dev';
  }
  if (process.argv[2] === '--demo') {
    console.log('imac-dev');
    return 'imac-dev';
  }
  console.log('imac-dev');
  return 'imac-dev';
}

exports.getWebcamStatus = memStore => {
  const webcamStatus = [
    'authorized',
    ['liveBroadcastId', 'videoId'],
    ['OBSWebSocketConnected', 'obsReady'],
    ['OBSWebSocketAuthenticated', 'obsAuthReady'],
    'streaming'
  ]
    .reduce((a, e) => {
      if (typeof e === 'string') return {...a, [e]: memStore[e]}
      if (typeof e === 'object') return {...a, [e[1]]: memStore[e[0]]}
    }, {});
  return webcamStatus;
}

exports.wait = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}