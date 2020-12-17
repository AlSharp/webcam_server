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

exports.wait = (sec, io) => {
  let counter = sec;
  io.of('webcam').emit('waitCounter', counter);
  const interval = setInterval(() => {
    io.of('webcam').emit('waitCounter', counter - 1);
    counter = counter - 1;
  }, 1000)
  return new Promise(resolve => setTimeout(() => {
    clearInterval(interval);
    return resolve();
  }, sec * 1000));
}