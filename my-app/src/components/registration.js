import "../assets/css/style.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Registration() {
  const [emailUser, getemail] = useState("");
  const [passwordUser, getpasword] = useState("");
  const [nameUser, getname] = useState("");
  const [roleUser, getrole] = useState("Admin");
  const navigate = useNavigate();
  const clickEvent = async (e) => {
    e.preventDefault();
    const url = "http://127.0.0.1:5000/login-register";
    if (!emailUser || !passwordUser || !nameUser || !roleUser) {
      alert("Please fill the full form");
      return;
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailUser, passwordUser, nameUser, roleUser }),
    });
    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      navigate("/");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="regicontainer">
      <form
        onSubmit={clickEvent}
        action="/login-register"
        method="POST"
        className="regform"
      >
        <div className="uname">
          <span>Enter Your Name</span>
          <input
            onChange={(e) => getname(e.target.value)}
            value={nameUser}
            type="text"
            name="Username"
            id=""
            placeholder="Name Here"
          />
        </div>
        <div className="Uemail">
          <span>Enter Your Email</span>
          <input
            onChange={(e) => getemail(e.target.value)}
            value={emailUser}
            type="email"
            name="email"
            id=""
            placeholder="Email Here"
          />
        </div>
        <div className="Upass">
          <span>Enter Your Pasword</span>
          <input
            onChange={(e) => getpasword(e.target.value)}
            value={passwordUser}
            type="password"
            name="password"
            id=""
            placeholder="Password Here"
          />
        </div>
        <div className="adminoruser">
          <span>Select Your Role</span>
          <select
            onChange={(e) => getrole(e.target.value)}
            value={roleUser}
            id="myDropdown"
          >
            <option value="option1">Admin</option>
            <option value="option2">User</option>
          </select>
        </div>

        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Registration;
