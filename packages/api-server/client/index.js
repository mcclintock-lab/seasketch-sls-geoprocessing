import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom'
import App from './components/app';
import theme from './theme';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { fetchProjects } from './actions/projects';
import { fetchInvocations } from './actions/invocations';
import store from './store';

ReactDOM.render((
  <Provider store={store}>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </Provider>
), document.getElementById('app'))

if (process.env.NODE_ENV === 'development') {
  module.hot.accept();
}


fetchProjects(store.dispatch)
setInterval(() => fetchProjects(store.dispatch), 10000);

fetchInvocations(store.dispatch)
setInterval(() => fetchInvocations(store.dispatch), 10000);