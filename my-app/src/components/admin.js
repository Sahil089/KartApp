import "../assets/css/style.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadPr } from "./reducers/singlePrSlice.js";
import { uploadcsv } from "./reducers/uploadCsvSlice";
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AdminUI() {
  const [imgurl, seturl] = useState("");
  const [prdname, setprd] = useState("");
  const [file, setfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const csverror = useSelector((state) => state.csvupload.error);
  const singleprerror = useSelector((state) => state.prupload.error);
  const csvmessage = useSelector((state) => state.csvupload.alertMsg);
  const singleprmessage = useSelector((state) => state.prupload.alertMsg);
  const clickEventprd = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (imgurl && prdname) {
      dispatch(uploadPr({ imgurl, prdname })).then((action) => {
        if (uploadPr.fulfilled.match(action)) {
          setLoading(false);
        }
        setLoading(false);
      });
    } else {
      toast.error("Enter Valid Data");
      setLoading(false);
    }
  };

  const handlecsvUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!file) {
      setLoading(false);
      alert("Please select a file.");
      return;
    }

    const fileData = new FormData();

    fileData.append("csvFile", file);

    dispatch(uploadcsv(fileData)).then((action) => {
      if (uploadcsv.fulfilled.match(action)) {
        if (csvmessage) {
          setLoading(false);
        }
      }
      setLoading(false);
    });
  };

  return (
    <div className="adminuicontainer">
      {loading && (
        <div className="spinner-overlay">
          <ClipLoader
            size={100}
            color={"rgb(21, 208, 221)"}
            loading={loading}
          />
        </div>
      )}
      <div className="singleproduct">
        <form
          onSubmit={clickEventprd}
          action="/add-product"
          method="post"
          className="singleproduct"
        >
          <div className="inputurl">
            <input
              placeholder="Enter Your URL"
              type="url"
              onChange={(e) => seturl(e.target.value)}
              value={imgurl}
              name="imageUrl"
              id=""
            />
          </div>
          <div className="inputname">
            <input
              placeholder="Enter Your Product Name"
              type="text"
              onChange={(e) => setprd(e.target.value)}
              value={prdname}
              name="productName"
              id=""
            />
          </div>
          <button type="submit">ADD</button>
        </form>
      </div>

      <div className="csvproduct">
        <form onSubmit={handlecsvUpload} action="/upload-csv" method="post">
          <div className="takefile">
            <input
              onChange={(e) => setfile(e.target.files[0])}
              type="file"
              name="csvFile"
              id=""
            />
          </div>
          <button type="submit">UPLOAD</button>
        </form>
        <p className="noteead">*NOTE</p>
        <span className="note">Only CSV file supported</span>
        <span className="note">CSV should have two columns</span>
        <span className="note">
          Column 1- product_name || Column 2 -image_url
        </span>
      </div>

      <div className="messages">
        {csvmessage && <div className="message success">{csvmessage}</div>}
        {csverror && <div className="message error">{csverror}</div>}
        {singleprmessage && (
          <div className="message success">{singleprmessage}</div>
        )}
        {singleprerror && <div className="message error">{singleprerror}</div>}
      </div>
      <ToastContainer />
    </div>
  );
}
export default AdminUI;
