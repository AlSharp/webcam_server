import React, {useState, useEffect, useRef} from 'react';
import CLIENT_ID from './secrets/clientId';
import HOST from './secrets/server_address';

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
      throw 'Could not authorize';
    }
    return res;
  } else {
    console.log('authResult: ', authResult);
  }
}

const App = () => {

  const [loaded, setLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState(null);

  const auth2Ref = useRef();

  useEffect(() => {
    const scriptTag = document.createElement('script');
    scriptTag.src = 'https://apis.google.com/js/client:platform.js';
    scriptTag.addEventListener('load', () => setLoaded(true));
    document.head.appendChild(scriptTag);
  }, [])

  useEffect(() => {
    if (!loaded) return;
    window.gapi.load('auth2', async () => {
      try {
        auth2Ref.current = await gapi.auth2.init({
          clientId: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube.readonly'
        })
        console.log('auth2 initialized');
        setInitialized(true);
      }
      catch(error) {
        console.log('auth2 init error', error)
      }
    });
  }, [loaded]);

  useEffect(() => {
    if (!initialized) return;
    const signInBtn = document.createElement('button');
    signInBtn.addEventListener('click', () => {
      auth2Ref.current.grantOfflineAccess()
        .then(signInCallback)
        .then(res => {
          console.log('res: ', res);
          setAuthorized(true);
        })
        .catch(error => setError())
    });
    signInBtn.click();
  }, [initialized]);

  return (
    <div>
      <h1>Authorization page</h1>
      <div>{error || ''}</div>
    </div>
  )
}

export default App;