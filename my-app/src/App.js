// src/App.js
import './App.css';
import Navbarcomponent from './components/navigation';
import UserUI from './components/user';
import Login from './components/login';
import './assets/css/style.css';
import AdminUI from './components/admin';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Registration from './components/registration';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './components/AuthContext.js';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Navbarcomponent />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/Register" element={<Registration />} />
            <Route element={<PrivateRoute />}>
              <Route path="/Admininterface" element={<AdminUI />} />
              <Route path="/Userinterface" element={<UserUI />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
