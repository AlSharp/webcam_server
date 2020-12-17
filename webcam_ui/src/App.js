import React, {useState, useEffect} from 'react';
import SocketIOClient from 'socket.io-client';

import SERVER_ADDRESS from './secrets/server-address';

const useMergeState = initialState => {
  const [state, setState] = useState(initialState);
  const setMergedState = nextState =>
    setState(prevState => Object.assign({}, prevState, nextState));
  return [state, setMergedState];
}

const getStatus = async () => {
  const response = await fetch(`${SERVER_ADDRESS}/get_status`);
  const res = await response.json();
  if (res.error) {
    throw res.error;
  }
  return res;
}

const startLiveBroadcast = async () => {
  const response = await fetch(`${SERVER_ADDRESS}/start_livebroadcast`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  const res = await response.json();
  if (res.error) {
    throw res.error;
  }
  return res;
}

const App = () => {

  const [{
    authorized = false,
    obsReady = false,
    obsAuthReady = false,
    streaming = false,
    videoId = null,
    count = null,
    error = null
  }, setState] = useMergeState({
    authorized: false,
    obsReady: false,
    obsAuthReady: false,
    streaming: false,
    videoId: null,
    count: null,
    error: null
  })

  useEffect(() => {
    
    const socket = SocketIOClient(SERVER_ADDRESS + '/webcam', {
      perMessageDeflate: false
    });

    socket.on('endSession', () => {
      window.close();
    });

    socket.on('webcamStatus', ({authorized, videoId, obsReady, obsAuthReady, streaming}) => {
      setState({authorized, videoId, obsReady, obsAuthReady, streaming});
    });

    socket.on('waitCounter', count => {
      setState({count});
    })
  }, []);

  useEffect(() => {
    getStatus()
      .then(res => {
        const {obsAuthReady, obsReady, authorized} = res;
        setState({obsAuthReady, obsReady, authorized});
      })
      .catch(error => setState({error}))
  }, [])

  useEffect(() => {
    if (!authorized) return;
    startLiveBroadcast()
      .catch(error => setState({error}))
  }, [authorized]);

  return (
    <div>
      <h1>IMAC WEB CAMERA</h1>
      <div>
        <div
          style={{display: 'inline-block', marginRight: '4px'}}
        >
          Camera
        </div>
        <div
          id="led"
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            backgroundColor: obsReady ? 'green' : 'red',
            borderRadius: '5px'
          }}
        ></div>
        <div
          style={{display: 'inline-block', margin: '0 4px 0 10px'}}
        >
          Authorized
        </div>
        <div
          id="led"
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            backgroundColor: authorized ? 'green' : 'red',
            borderRadius: '5px'
          }}
        ></div>
      </div>
      {
        streaming ?
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&livemonitor=1`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        >
        </iframe> :
        null
      }
      {
        !authorized ?
        <h1>Application does not have permissions to start video live streaming</h1> :
        !obsReady && !obsAuthReady ?
        <h1>Camera is not ready</h1> :
        !streaming ?
        <h1>{`Wait! Starting video stream... ${count || ''}`}</h1> :
        null
      }
      {
        error ? <div>{error}</div> : null
      }
    </div>
  )
}

export default App;