const http = require('http');
const {getImacHostName} = require('./utils');

module.exports = {
  getSessionStatus: (sessionId, event) => {
    return new Promise((resolve, reject) => {
      const options = {
        protocol: 'http:',
        host: getImacHostName(),
        port: 5000,
        path: `/api/webcam/verify?sessionId=${sessionId}&event=${event}`,
        method: 'GET',
        timeout: 3000
      };

      const req = http.request(options, res => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });

      req.on('error', error => reject(error));
      req.on('timeout', () => {
        req.abort();
      });
      req.on('abort', () => reject(new Error('Request was aborted by timeout')));
      req.end();
    })
  },
  forceLogout: sessionId => {
    return new Promise((resolve, reject) => {
      const options = {
        protocol: 'http:',
        host: getImacHostName(),
        port: 5000,
        path: `/api/webcam/force_logout`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 3000
      };

      const req = http.request(options, res => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });

      req.on('error', error => reject(error));
      req.on('timeout', () => {
        req.abort();
      });
      req.on('abort', () => reject(new Error('Request was aborted by timeout')));
      req.write(JSON.stringify({sessionId}));
      req.end();
    })
  }
}