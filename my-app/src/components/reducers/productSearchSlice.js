import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const imageData = createAsyncThunk("imageData", async (fileData) => {
  const imgurl = "http://127.0.0.1:5000/submit";
  const response = await axios.post(imgurl, fileData);
  console.log(response.data);
  return response.data;
});

export const prData = createAsyncThunk("prData", async (prName) => {
  const imgurl = "http://127.0.0.1:5000/submit-name";
  const response = await axios.post(imgurl, { prName });
  return response.data;
});

const prDetailsSlice = createSlice({
  name: "prDetails",
  initialState: {
    prnameurls: [],
    imagdataurls: [],
    alertMsg: null,
    error: null,
  },
  reducers: {
    setimgurlData(state, action) {
      state.imagdataurls = action.payload.image_urls || [];
      state.alertMsg = action.payload.message;
    },
    setprNameData(state, action) {
      state.prnameurls = action.payload.prnameurls || [];
      state.alertMsg = action.payload.message;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(imageData.pending, (state) => {
        state.alertMsg = null;
      })
      .addCase(imageData.fulfilled, (state, action) => {
        state.imagdataurls = action.payload.image_urls || [];
        state.alertMsg = action.payload.message;
      })
      .addCase(imageData.rejected, (state, action) => {
        state.error = action.payload
          ? action.payload.message
          : action.error.message;
      })
      .addCase(prData.pending, (state) => {
        state.alertMsg = null;
      })
      .addCase(prData.fulfilled, (state, action) => {
        state.prnameurls = action.payload.prnameurls || [];
        state.alertMsg = action.payload.message;
      })
      .addCase(prData.rejected, (state, action) => {
        state.error = action.payload
          ? action.payload.message
          : action.error.message;
      });
  },
});

export const { setimgurlData, setprNameData } = prDetailsSlice.actions;

export default prDetailsSlice.reducer;
