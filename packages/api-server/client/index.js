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

// Disable while using alpha react hooks
// if (process.env.NODE_ENV === 'development') {
//   module.hot.accept();
// }


fetchProjects(store.dispatch, localStorage.token)
setInterval(() => fetchProjects(store.dispatch, localStorage.token), 10000);

fetchInvocations(store.dispatch, localStorage.token);
setInterval(() => fetchInvocations(store.dispatch, localStorage.token), 10000);