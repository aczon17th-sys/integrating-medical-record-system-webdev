const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ensurePatientForUser } = require("../utils/patientAccount");
const { getJwtSecret } = require("../config/jwt");

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      patientId: user.patientId
    },
    getJwtSecret(),
    { expiresIn: "1d" }
  );
};

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  patientId: user.patientId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    const { Op } = require("sequelize");
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "staff"
    });

    if (user.role === "patient") {
      await ensurePatientForUser(user);
      await user.reload();
    }

    res.status(201).json({
      message: "User registered successfully",
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to register user", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const login = email || username;

    if (!login || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const { Op } = require("sequelize");
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: login }, { username: login }]
      }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (user.role === "patient") {
      await ensurePatientForUser(user);
      await user.reload();
    }

    res.json({
      token: createToken(user),
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to login", error: error.message });
  }
};
