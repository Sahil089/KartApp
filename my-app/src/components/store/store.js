import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authSlice from "../reducers/authSlice";
import singlePrSlice from "../reducers/singlePrSlice";
import uploadCsvSlice from "../reducers/uploadCsvSlice";
import productSearchSlice from "../reducers/productSearchSlice";

const rootReducer = combineReducers({
  aut: authSlice,
  prupload: singlePrSlice,
  csvupload: uploadCsvSlice,
  prDetails : productSearchSlice,
});

export const store = configureStore({
  reducer: rootReducer,
});
