import {compose, createStore, applyMiddleware} from 'redux';
import { mapMiddleware } from '@mapbox/mapbox-gl-redux'
import reducer from './reducers'
import ReduxThunk from 'redux-thunk'

import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web and AsyncStorage for react-native
import { createFilter, createBlacklistFilter } from 'redux-persist-transform-filter';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'

const saveSubsetFilter = createFilter(
  'examples',
  ['selected']
);

const persistConfig = {
  key: 'root',
  storage,
  transforms: [saveSubsetFilter],
  stateReconciler: autoMergeLevel2,
  blacklist: ['results']
}

const persistedReducer = persistReducer(persistConfig, reducer)

const store = createStore(
  persistedReducer,
  applyMiddleware(mapMiddleware, ReduxThunk)
)

let persistor = persistStore(store)


window.store = store;

// export default store
export { store, persistor };
