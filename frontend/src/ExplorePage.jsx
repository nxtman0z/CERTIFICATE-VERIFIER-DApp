// ExplorePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ExplorePage() {
  const { cid } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await axios.get(`https://ipfs.io/ipfs/${cid}`, {
          responseType: "blob",
        });

        const fileType = res.data.type;
        const fileSize = res.data.size || res.headers["content-length"];

        setFileInfo({
          cid,
          url: `https://ipfs.io/ipfs/${cid}`,
          type: fileType,
          size: fileSize,
        });
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching IPFS data:", err);
        setError("Failed to load file from IPFS. It might have been unpinned or the CID is invalid.");
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [cid]);

  const renderFilePreview = () => {
    if (!fileInfo || !fileInfo.type) return null;

    if (fileInfo.type.startsWith("image/")) {
      return (
        <div className="text-center my-4">
          <img
            src={fileInfo.url}
            alt="Certificate Preview"
            className="img-fluid rounded shadow-sm"
            style={{ maxWidth: "100%", maxHeight: "600px" }}
          />
        </div>
      );
    }
    
    if (fileInfo.type === "application/pdf") {
      return (
        <div className="my-4" style={{ height: '600px' }}>
          <iframe
            src={fileInfo.url}
            title="Certificate Preview"
            width="100%"
            height="100%"
            style={{ border: '1px solid #ddd', borderRadius: '8px' }}
          ></iframe>
        </div>
      );
    }
    
    // Fallback for other file types
    return (
      <div className="alert alert-warning mt-4">
        File preview is not available for this type: **{fileInfo.type}**.
      </div>
    );
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold">🧭 Certificate Details</h2>
        <Link to="/" className="btn btn-outline-secondary">
          ⬅️ Back to Certificates
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading file info from IPFS...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger mt-5">{error}</div>
      ) : fileInfo ? (
        <div className="card shadow-lg border-0">
          <div className="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
            File Metadata
            <a
              href={fileInfo.url}
              className="btn btn-light btn-sm fw-bold"
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇️ Download File
            </a>
          </div>
          <div className="card-body">
            <p>
              <strong>CID:</strong> <span className="text-break">{fileInfo.cid}</span>
            </p>
            <p>
              <strong>IPFS URL:</strong>{" "}
              <a href={fileInfo.url} target="_blank" rel="noopener noreferrer">
                <span className="text-break">{fileInfo.url}</span>
              </a>
            </p>
            <p>
              <strong>File Type:</strong> {fileInfo.type || "Unknown"}
            </p>
            <p>
              <strong>File Size:</strong>{" "}
              {fileInfo.size
                ? `${(fileInfo.size / 1024).toFixed(2)} KB`
                : "N/A"}
            </p>

            {renderFilePreview()}
          </div>
        </div>
      ) : null}
    </div>
  );
}