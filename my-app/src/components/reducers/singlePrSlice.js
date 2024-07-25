import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";


export const uploadPr = createAsyncThunk(
    "singlepr",
    async ({ imgurl, prdname }) => {
      const endpointpr = "http://127.0.0.1:5000/add-product";
  
      const response = await axios.post(endpointpr, { imgurl, prdname });
      return response.data;
    }
  );
  
  const singlePrSlice = createSlice({
    name: "singlePr",
    initialState: {
      alertMsg: null,
      error: null,
    },
    reducers: {
      sucessMsg(state) {
        state.alertMsg = null;
        state.error = null;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(uploadPr.pending, (state,action) => {
          state.alertMsg=null;
          state.error=null;
  
        })
        .addCase(uploadPr.fulfilled, (state, action) => {
          state.alertMsg=action.payload.message;
        })
        .addCase(uploadPr.rejected, (state, action) => {
            state.error= "Product Already Present";
        });
    },
  });
  


export const {sucessMsg}=singlePrSlice.actions;

export default singlePrSlice.reducer;