import React, { useState } from "react";
import { Link, BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ExplorePage from "./ExplorePage";
import "bootstrap/dist/css/bootstrap.min.css";
import { connectWallet } from "./utils/wallet";
import { uploadToIPFS, deleteFromIPFS } from "./utils/ipfs";
import { issueCertificate, getCertificates } from "./utils/contract";

// Your original MainApp component with new eye-catching backgrounds
function MainApp() {
  const [wallet, setWallet] = useState(null);
  const [file, setFile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [message, setMessage] = useState("");

  const handleConnect = async () => {
    try {
      const data = await connectWallet();
      if (data) {
        setWallet(data);
        setMessage("✅ Wallet Connected Successfully!");
        await loadCertificates(data.provider, data.address);
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setMessage("❌ Wallet connection failed");
    }
  };

  const handleUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const handleIssue = async () => {
    if (!wallet || !file) return alert("Wallet or file missing");

    const ipfsUrl = await uploadToIPFS(file);
    if (!ipfsUrl) return alert("IPFS upload failed");

    const ipfsHash = ipfsUrl.split("/").pop();
    await issueCertificate(wallet.signer, wallet.address, ipfsHash);
    setMessage("🎉 Certificate issued successfully!");

    setFile(null);
    await loadCertificates(wallet.provider, wallet.address);
  };

  const handleDelete = async (cid) => {
    try {
      const success = await deleteFromIPFS(cid);
      if (success) {
        setCertificates(certificates.filter((cert) => cert.ipfsHash !== cid));
        setMessage("🗑️ Certificate deleted successfully!");
      } else {
        alert("❌ Failed to delete from Pinata. Ensure it's pinned by your account.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Error while deleting");
    }
  };

  const isCIDAlive = async (cid) => {
    const token = process.env.REACT_APP_PINATA_JWT;
    if (!token) {
      console.warn("⚠️ Missing REACT_APP_PINATA_JWT");
      return false;
    }

    try {
      const res = await fetch(`https://api.pinata.cloud/data/pinList?hashContains=${cid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Pinata pinList error:", errorData);
        return false;
      }

      const data = await res.json();
      return data.count > 0;
    } catch (err) {
      console.error("Pinata check failed:", err);
      return false;
    }
  };

  const loadCertificates = async (provider, address) => {
    const certs = await getCertificates(provider, address);
    const filtered = [];

    for (const cert of certs) {
      const alive = await isCIDAlive(cert.ipfsHash);
      if (alive) filtered.push(cert);
    }

    const updated = filtered
      .filter((_, i) => ![1, 2, 3, 4, 7].includes(i))
      .sort((a, b) => Number(a.issuedAt) - Number(b.issuedAt));

    setCertificates(updated);
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <div className="container py-5">
        <h1 className="text-center mb-5 fw-bold" style={{ color: '#ffffff' }}>
          🎓 Certificate Verifier DApp
        </h1>

        {message && (
          <div className="alert alert-success text-center fw-bold">{message}</div>
        )}

        {!wallet ? (
          <div className="text-center p-5 rounded-3 shadow-sm" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}>
            <h2 className="mb-4" style={{ color: '#667eea' }}>Connect your Wallet to get started</h2>
            <button className="btn btn-lg" style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)', color: 'white', border: 'none' }} onClick={handleConnect}>
              🔗 Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="alert border-0 shadow-sm" style={{ background: 'rgba(255,255,255,0.9)', color: '#667eea', backdropFilter: 'blur(10px)' }}>
              <strong>Wallet Connected:</strong> {wallet.address}
            </div>

            <div className="card mb-4 shadow" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-header fw-bold text-white" style={{ background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)' }}>📤 Upload Certificate</div>
              <div className="card-body">
                <input
                  type="file"
                  className="form-control mb-3"
                  onChange={handleUpload}
                />
                <button
                  className="btn text-white"
                  style={{ background: 'linear-gradient(45deg, #27ae60, #2ecc71)' }}
                  onClick={handleIssue}
                  disabled={!file}
                >
                  🚀 Issue Certificate
                </button>
              </div>
            </div>

            <div className="card shadow" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-header text-white fw-bold" style={{ background: 'linear-gradient(45deg, #3498db, #2980b9)' }}>📁 Issued Certificates</div>
              <div className="card-body">
                {certificates.length > 0 ? (
                  <div className="row">
                    {certificates.map((cert, idx) => (
                      <div className="col-md-6 mb-4" key={idx}>
                        <div className="card shadow-sm h-100" style={{ background: '#FFFFFF', border: '2px solid #667eea' }}>
                          <div className="card-body d-flex flex-column justify-content-between">
                            <div>
                              <h5 className="card-title" style={{ color: '#667eea' }}>
                                📄 Certificate #{idx + 1}
                              </h5>
                              <p className="card-text text-muted">
                                🕓 Issued At: {new Date(Number(cert.issuedAt) * 1000).toLocaleString()}
                              </p>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                              <a
                                href={`https://ipfs.io/ipfs/${cert.ipfsHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-primary"
                              >
                                🔍 View
                              </a>
                              <Link
                                to={`/explore/${cert.ipfsHash}`}
                                className="btn btn-outline-dark"
                              >
                                🧭 Explore
                              </Link>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(cert.ipfsHash)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No certificates found.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .hero-section {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%);
          min-height: 90vh;
          display: flex;
          align-items: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .hero-content {
          animation: fadeInUp 1s ease-out;
          position: relative;
          z-index: 2;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          animation: slideInLeft 1s ease-out 0.2s both;
        }
        .hero-subtitle {
          font-size: 1.3rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          animation: slideInRight 1s ease-out 0.4s both;
        }
        .hero-buttons {
          animation: fadeInUp 1s ease-out 0.6s both;
        }
        .btn-hero {
          padding: 15px 40px;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 50px;
          margin: 0 10px;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          cursor: pointer;
          border: none;
        }
        .btn-hero:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .btn-primary-hero {
          background: linear-gradient(45deg, #4facfe, #00f2fe);
          color: white;
        }
        .btn-secondary-hero {
          background: transparent;
          border: 2px solid white;
          color: white;
        }
        .feature-card {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          margin: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          animation: fadeInUp 1s ease-out;
        }
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          animation: bounce 2s infinite;
        }
        .stats-section {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          padding: 4rem 0;
        }
        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          animation: pulse 3s infinite;
        }
        .floating-shapes {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
        }
        .shape {
          position: absolute;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }
        .shape:nth-child(1) {
          width: 80px; height: 80px;
          top: 20%; left: 10%;
          animation-delay: 0s;
        }
        .shape:nth-child(2) {
          width: 120px; height: 120px;
          top: 60%; right: 15%;
          animation-delay: 2s;
        }
        .shape:nth-child(3) {
          width: 60px; height: 60px;
          top: 80%; left: 20%;
          animation-delay: 4s;
        }
      `}</style>
      <section className="hero-section">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="hero-content">
                <h1 className="hero-title">🎓 Secure Certificate Verification</h1>
                <p className="hero-subtitle">
                  Revolutionary blockchain-based certificate management system. 
                  Issue, verify, and manage digital certificates with complete transparency and security.
                </p>
                <div className="hero-buttons">
                  <Link to="/signup" className="btn btn-primary-hero btn-hero">
                    Get Started 🚀
                  </Link>
                  <a href="#features" className="btn btn-secondary-hero btn-hero">
                    Learn More 📖
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div style={{fontSize: '12rem', animation: 'pulse 3s infinite'}}>🛡️</div>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="py-5" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-4 fw-bold" style={{color: '#2c3e50'}}>
              Why Choose Our Platform?
            </h2>
            <p className="lead" style={{color: '#34495e'}}>Cutting-edge technology for certificate management</p>
          </div>
          <div className="row">
            <div className="col-md-4">
              <div className="feature-card text-center">
                <div className="feature-icon">🔒</div>
                <h4 style={{color: '#e74c3c'}}>Blockchain Security</h4>
                <p className="text-muted">
                  Certificates stored on blockchain ensure tamper-proof verification 
                  and permanent record keeping.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card text-center">
                <div className="feature-icon">⚡</div>
                <h4 style={{color: '#f39c12'}}>Instant Verification</h4>
                <p className="text-muted">
                  Verify certificates instantly with our smart contract technology. 
                  No more waiting for manual verification.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card text-center">
                <div className="feature-icon">🌐</div>
                <h4 style={{color: '#27ae60'}}>IPFS Storage</h4>
                <p className="text-muted">
                  Decentralized storage ensures your certificates are always 
                  accessible and never lost.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="stats-section">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-3">
              <div className="stat-number">1000+</div>
              <p>Certificates Issued</p>
            </div>
            <div className="col-md-3">
              <div className="stat-number">500+</div>
              <p>Organizations</p>
            </div>
            <div className="col-md-3">
              <div className="stat-number">99.9%</div>
              <p>Uptime</p>
            </div>
            <div className="col-md-3">
              <div className="stat-number">24/7</div>
              <p>Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="container py-3" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="text-center mb-3">
            <h1 className="display-4 fw-bold text-success">About Us</h1>
            <div style={{fontSize: '4rem'}}>📚</div>
          </div>
          
          <div className="card shadow-lg border-0">
            <div className="card-body p-4">
              <h3 className="text-success mb-3">Our Mission</h3>
              <p className="lead mb-3">
                We're revolutionizing the way certificates are issued, stored, and verified 
                using cutting-edge blockchain technology. Our platform ensures complete 
                transparency, security, and accessibility for all stakeholders.
              </p>
              
              <h3 className="text-success mb-3">What We Do</h3>
              <div className="mb-2">
                <span className="text-success me-3">✅</span>
                <strong>Secure Certificate Issuance:</strong> Generate tamper-proof digital certificates
              </div>
              <div className="mb-2">
                <span className="text-success me-3">✅</span>
                <strong>Instant Verification:</strong> Verify authenticity in seconds
              </div>
              <div className="mb-2">
                <span className="text-success me-3">✅</span>
                <strong>Decentralized Storage:</strong> IPFS integration for permanent accessibility
              </div>
              <div className="mb-2">
                <span className="text-success me-3">✅</span>
                <strong>Blockchain Integration:</strong> Ethereum-based smart contracts
              </div>
              
              <div className="text-center mt-4">
                <Link to="/home" className="btn btn-success btn-lg">
                  Back to Home 🏠
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Updated LoginPage component with better styling

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("loggedIn", "true");
        alert("✅ Login successful!");
        navigate("/certificates");
      } 
else {
        alert(`❌ ${data.message || "Login failed"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error connecting to server");
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes fadeInSlideDown {
          from { opacity: 0; transform: translateY(-50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0% { box-shadow: 0 0 15px rgba(255,255,255,0.2); }
          50% { box-shadow: 0 0 25px rgba(255,255,255,0.4); }
          100% { box-shadow: 0 0 15px rgba(255,255,255,0.2); }
        }
        .login-card {
          animation: fadeInSlideDown 0.8s ease-out;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .login-card:hover {
          animation: none;
          box-shadow: 0 15px 45px rgba(0,0,0,0.3);
        }
        .form-control:focus {
          border-color: #4b6cb7;
          box-shadow: 0 0 0 0.2rem rgba(75, 108, 183, 0.25);
        }
        .btn-login {
          background: linear-gradient(45deg, #4b6cb7, #182848);
          border: none;
          transition: all 0.3s ease;
        }
        .btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(75, 108, 183, 0.3);
        }
        .form-label {
          color: #182848;
        }
        .card-title {
          color: #182848;
        }
      `}</style>
      <div className="container py-5 d-flex align-items-center justify-content-center">
        <div className="row justify-content-center w-100">
          <div className="col-md-5 col-lg-4">
            <div className="card shadow-lg border-0 login-card">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold card-title" style={{ color: '#4b6cb7' }}>Welcome Back!</h2>
                  <p className="text-muted">Sign in to your account</p>
                </div>
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      style={{ borderRadius: '10px' }}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Password</label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      style={{ borderRadius: '10px' }}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-login btn-lg w-100 mb-3 text-white fw-bold" style={{ borderRadius: '10px' }}>
                    Sign In
                  </button>
                  <div className="text-center">
                    <p className="text-muted">
                      Don't have an account?
                      <Link to="/signup" className="text-primary text-decoration-none ms-1">
                        Sign up here
                      </Link>
                    </p>
                    <Link to="/home" className="btn btn-outline-secondary mt-3">
                      Back to Home
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// SignupPage with consistent styling
function SignupPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Signup successful! Please log in.");
        navigate("/login");
      } else {
        alert(`❌ ${data.message || "Signup failed"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error connecting to server");
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflow: 'hidden'
    }}>
      <style>{`
        .signup-card {
          animation: fadeInSlideDown 0.8s ease-out;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.2);
        }
        .signup-card:hover {
          box-shadow: 0 15px 45px rgba(0,0,0,0.3);
        }
        .signup-btn {
          background: linear-gradient(45deg, #4b6cb7, #182848);
          border: none;
          color: white;
          transition: all 0.3s ease;
        }
        .signup-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(75, 108, 183, 0.3);
        }
      `}</style>
      <div className="signup-card p-5" style={{
        width: '100%',
        maxWidth: '400px',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#182848',
            marginBottom: '8px'
          }}>Create Account</h1>
        </div>
        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#555',
              fontSize: '14px',
              fontWeight: '500'
            }}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4b6cb7'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#555',
              fontSize: '14px',
              fontWeight: '500'
            }}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create your password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4b6cb7'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>
          <button
            type="submit"
            className="signup-btn"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Sign up
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '14px', margin: '0' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4b6cb7',
                  textDecoration: 'none',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.target.style.textDecoration = 'none'}
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// Navigation Component with updated colors
function Navigation() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top" style={{
      background: 'linear-gradient(90deg, #4b6cb7 0%, #182848 100%)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.2)'
    }}>
      <div className="container">
        <Link className="navbar-brand fw-bold text-white" to="/home" style={{ fontSize: '1.5rem' }}>
          🎓 CertifyChain
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link text-white fw-semibold" to="/home">🏠 Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white fw-semibold" to="/about">ℹ️ About</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white fw-semibold" to="/certificates">📄 Certificates</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link btn btn-outline-light ms-2 me-2" to="/login" style={{ borderRadius: '20px' }}>🔐 Login</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link btn btn-light text-dark fw-bold" to="/signup" style={{ borderRadius: '20px' }}>🚀 Sign Up</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
// Main App Wrapper
export default function AppWrapper() {
  return (
    <div>
      <style>{`
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .navbar-nav .nav-link {
          transition: all 0.3s ease;
        }
        .navbar-nav .nav-link:hover {
          transform: translateY(-2px);
        }
        .btn {
          transition: all 0.3s ease;
        }
        .btn:hover {
          transform: translateY(-1px);
        }
      `}</style>
      <Router>
        <div style={{ paddingTop: '76px' }}>
          <Navigation />
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} /> 
            <Route path="/home" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
  path="/certificates"
  element={
    localStorage.getItem("loggedIn") === "true"
      ? <MainApp />
      : (() => {
          alert("⚠️ Please login to access certificates");
          return <Navigate to="/login" />;
        })()
  }
/>



            <Route path="/explore/:cid" element={<ExplorePage />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}