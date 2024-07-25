import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";


export const userAut = createAsyncThunk(
  "login",
  async ({ email, password, isAdmin }) => {
    const url = isAdmin
      ? "http://127.0.0.1:5000/admin-login"
      : "http://127.0.0.1:5000/user-login";

    const response = await axios.post(url, { email, password });
    return { isAdmin, data: response.data };
  }
);

const autSlice = createSlice({
  name: "aut",
  initialState: {
    isAdmin: false,
    error: null,
    isAuthenticated: false,
    alertMessage: null,
  },
  reducers: {
    logout(state) {
      state.isAuthenticated = false;
      state.isAdmin = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(userAut.pending, (state) => {
        state.isAuthenticated = false;
        state.alertMessage = null;
      })
      .addCase(userAut.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.isAdmin = action.payload.isAdmin;
        state.alertMessage = action.payload.data.message;
      })
      .addCase(userAut.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.error = "Sorry No User Found";
      });
  },
});
export const { logout } = autSlice.actions;

export default autSlice.reducer;


