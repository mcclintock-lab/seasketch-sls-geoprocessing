import {compose, createStore, applyMiddleware} from 'redux';
import reducer from './reducers'
import ReduxThunk from 'redux-thunk'


const store = createStore(
  reducer,
  applyMiddleware(ReduxThunk)
)

window.store = store;

export default store
