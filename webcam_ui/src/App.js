import React, {useEffect} from 'react';
import SocketIOClient from 'socket.io-client';

import SERVER_ADDRESS from './secrets/server-address';

const App = () => {

  useEffect(() => {
    

    const socket = SocketIOClient(SERVER_ADDRESS, {
      perMessageDeflate: false
    });

    const led = document.getElementById('led');
    const memoryUsage = document.getElementById('memoryUsage');

    socket.on('connect', () => {
      led.style.backgroundColor = 'green';
    });

    socket.on('disconnect', () => {
      led.style.backgroundColor = 'red';
    })

    socket.on('memoryUsed', data => {
      memoryUsage.textContent = 'Process is using ' + (data / 1000 / 1000).toFixed(3) + ' MB';
    });

    socket.on('endSession', () => {
      window.close();
    });
  }, []);

  return (
    <div>
      <h1>IMAC WEB CAMERA</h1>
      <div>
        <div
          style={{display: 'inline-block', marginRight: '4px'}}
        >
          Live stream
        </div>
        <div
          id="led"
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            backgroundColor: 'red',
            borderRadius: '5px'
          }}
        ></div>
      </div>
      <div id="memoryUsage">Process is using ... MB</div>
      <iframe width="560" height="315" src="https://www.youtube.com/embed/live_stream?channel=UCZdirkP-LcnT-alWHCTPlXg" frameBorder="0" allowFullScreen></iframe>
    </div>
  )
}

export default App;