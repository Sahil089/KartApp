import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const uploadcsv = createAsyncThunk("csvUpload", async (fileData) => {
  const csvurl = "http://127.0.0.1:5000/upload-csv";

  const response = await axios.post(csvurl, fileData);

  return response.data; 
});

const uploadCsvSlice = createSlice({
  name: "csvUploadSlice",
  initialState: {
    alertMsg: null,
    error: null,
  },
  reducers: {
    csvresponse(state) {
      state.alertMsg = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadcsv.pending, (state,action) => { 
        state.alertMsg = null;
        state.error = action.payload.message;
      })
      .addCase(uploadcsv.fulfilled, (state, action) => { 
        state.alertMsg = `${action.payload.message}\nDuplicates:${action.payload.duplicate_count}\nNew Records:${action.payload.new_records_added}`;
      })
      .addCase(uploadcsv.rejected, (state, action) => { 
        state.error=action.payload?.message || "Invalid CSV Format";
      });
  },
});

export const { csvresponse } = uploadCsvSlice.actions;
export default uploadCsvSlice.reducer;
