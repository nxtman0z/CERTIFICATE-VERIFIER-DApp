const db = require('../db/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;

exports.signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, saltRounds);

    db.query("INSERT INTO users (email, password) VALUES (?, ?)", [email, hash], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already exists" });
        }
        return res.status(500).json({ message: "Database error", error: err });
      }
      res.status(201).json({ message: "User registered successfully" });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token (optional for now)
    const token = jwt.sign({ id: user.id }, "your_secret_key", { expiresIn: '1d' });

    res.json({ message: "Login successful", token });
  });
};
