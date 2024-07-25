
import React from 'react';
import {  Navigate , Outlet} from 'react-router-dom';
import { useAuth } from '../components/AuthContext.js';

const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;
