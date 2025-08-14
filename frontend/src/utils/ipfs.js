// utils/ipfs.js
import axios from "axios";

const API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const API_SECRET = process.env.REACT_APP_PINATA_SECRET_API_KEY;

export async function uploadToIPFS(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxContentLength: "Infinity",
      headers: {
        pinata_api_key: API_KEY,
        pinata_secret_api_key: API_SECRET,
      },
    });

    const cid = res.data.IpfsHash;
    return `https://ipfs.io/ipfs/${cid}`;
  } catch (err) {
    console.error("IPFS upload failed", err.response?.data || err.message);
    return null;
  }
}

export async function deleteFromIPFS(cid) {
  try {
    const res = await axios.delete(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      headers: {
        pinata_api_key: API_KEY,
        pinata_secret_api_key: API_SECRET,
      },
    });

    return res.status === 200;
  } catch (err) {
    console.error("Delete from IPFS failed", err.response?.data || err.message);
    return false;
  }
}
