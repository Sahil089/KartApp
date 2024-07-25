import "../assets/css/style.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { imageData, prData } from "../components/reducers/productSearchSlice";
import { ClipLoader } from "react-spinners";
import logo from "../assets/images/img.png";
import searchIcon from "../assets/images/search.png";

function UserUI() {
  const [imageurl, setImageurl] = useState(null);
  const [prName, setName] = useState("");
  const { prnameurls, imagdataurls } = useSelector((state) => state.prDetails);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const dispatch = useDispatch();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageurl(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clickEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (imageurl || prName) {
      if (imageurl) {
        const fileData = new FormData();
        fileData.append("file", imageurl);
        await dispatch(imageData(fileData));
      } else {
        await dispatch(prData(prName));
      }
      setLoading(false);
    } else {
      setLoading(false);
      alert("Please Enter or Select a File or Product Name");
    }
  };

  return (
    <div>
      {loading && (
        <div className="spinner-overlay">
          <ClipLoader size={150} color={"rgb(21, 208, 221)"} loading={loading} />
        </div>
      )}
      <form onSubmit={clickEvent}>
        <div className="serc-bar">
          <input
            onChange={(e) => setName(e.target.value)}
            type="text"
            className="txt-searc"
            placeholder="Search"
          />
          <div className="icon-container">
            <label htmlFor="img-searc" className="img-searc-label">
              <img src={logo} alt="" className="img-searc-icon" />
            </label>
            <input
              onChange={handleImageChange}
              id="img-searc"
              type="file"
              className="img-searc"
              accept="image/*"
            />
          </div>
          <div className="icon-container">
            <img
              src={searchIcon}
              alt="Search"
              className="search-icon"
              onClick={clickEvent}
            />
          </div>
          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
            </div>
          )}
        </div>
      </form>
      <div className="container">
        {prnameurls.length > 0 ? (
          prnameurls.map((imgUrl, index) => (
            <div key={index} className="column">
              <img src={imgUrl} alt="" className="prdetails" />
            </div>
          ))
        ) : (
          imagdataurls.map((imgUrl, index) => (
            <div key={index} className="column">
              <img src={imgUrl} alt="" className="prdetails" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserUI;
