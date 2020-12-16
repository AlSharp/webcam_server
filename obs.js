const obsStartStreaming = obs => {
  return new Promise((resolve, reject) => {
    obs.sendCallback('StartStreaming', error => {
      if (error) {
        return reject(error);
      }
      return resolve();
    })
  })
}

const obsStopStreaming = obs => {
  return new Promise((resolve, reject) => {
    obs.sendCallback('StopStreaming', error => {
      if (error) {
        return reject(error);
      }
      return resolve();
    })
  })
}

module.exports = {
  obsStartStreaming,
  obsStopStreaming
}