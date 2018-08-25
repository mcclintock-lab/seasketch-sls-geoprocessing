import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app.js';
import {store, persistor} from './store'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>, document.querySelector('#app')
);
