import React, {useState, useEffect, useRef} from 'react';
import CLIENT_ID from './secrets/clientId';
import HOST from './secrets/server_address';

const useMergeState = initialState => {
  const [state, setState] = useState(initialState);
  const setMergedState = nextState =>
    setState(prevState => Object.assign({}, prevState, nextState));
  return [state, setMergedState];
}

const getAuthStatus = async () => {
  const response = await fetch(`${HOST}/auth_status`);

  const res = await response.json();
  if (res.error) {
    throw res.error;
  }
  return res;
}

const signInCallback = async authResult => {
  if(authResult['code']) {
    const response = await fetch(`${HOST}/store_auth_code`, {
      method: 'POST',
      mode:'cors',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({code: authResult.code})
    });
    const res = await response.json();
    if (res.error) {
      throw res.error;
    }
    return res;
  } else {
    console.log('authResult: ', authResult);
  }
}

const App = () => {

  const [{
    loaded = false,
    initialized = false,
    authorized = true,
    error = null
  }, setState] = useMergeState({
    loaded: false,
    initialized: false,
    authorized: true,
    error: null
  })

  const auth2Ref = useRef();

  useEffect(() => {
    getAuthStatus()
      .then(res => setState({authorized: res.data.status}))
      .catch(error => setState({error}))
  }, [])

  useEffect(() => {
    if (authorized) return;
    const scriptTag = document.createElement('script');
    scriptTag.src = 'https://apis.google.com/js/client:platform.js';
    scriptTag.addEventListener('load', () => setState({loaded: true}));
    document.head.appendChild(scriptTag);
  }, [authorized])

  useEffect(() => {
    if (authorized) return;
    if (!loaded) return;
    window.gapi.load('auth2', async () => {
      try {
        auth2Ref.current = await gapi.auth2.init({
          clientId: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube.readonly'
        })
        console.log('auth2 initialized');
        setState({initialized: true})
      }
      catch(error) {
        console.log('auth2 init error', error)
      }
    });
  }, [authorized, loaded]);

  useEffect(() => {
    if (authorized) return;
    if (!initialized) return;
    const signInBtn = document.createElement('button');
    signInBtn.addEventListener('click', () => {
      auth2Ref.current.grantOfflineAccess()
        .then(signInCallback)
        .then(res => setState({authorized: true}))
        .catch(error => setState({error}))
    });
    signInBtn.click();
  }, [authorized, initialized]);

  return (
    <div>
      <h1>Authorization page</h1>
      <div>{authorized ? 'Authorized' : 'Not authorized'}</div>
      <div>{error || ''}</div>
    </div>
  )
}

export default App;