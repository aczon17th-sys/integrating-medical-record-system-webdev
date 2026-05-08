const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const User = require("../models/User");

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  licenseId: user.licenseId,
  staffId: user.staffId,
  patientId: user.patientId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const validateRoleCredential = ({ role, licenseId, staffId }) => {
  if (role === "doctor" && !licenseId) {
    return "Doctor accounts require a license ID";
  }

  if (role === "staff" && !staffId) {
    return "Staff accounts require a staff ID";
  }

  return null;
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "role", "licenseId", "staffId", "patientId", "createdAt", "updatedAt"],
      order: [["id", "ASC"]]
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const { licenseId, staffId, patientId } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "Username, email, password, and role are required" });
    }

    const credentialError = validateRoleCredential({ role, licenseId, staffId });

    if (credentialError) {
      return res.status(400).json({ message: credentialError });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const user = await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      licenseId: role === "doctor" ? licenseId : null,
      staffId: role === "staff" ? staffId : null,
      patientId: role === "patient" ? patientId || null : null
    });

    res.status(201).json(serializeUser(user));
  } catch (error) {
    res.status(400).json({ message: "Failed to create user", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { username, email, password, role, licenseId, staffId, patientId } = req.body;
    const updates = {};

    if (username) {
      updates.username = username;
    }

    if (email) {
      updates.email = email;
    }

    if (role) {
      updates.role = role;
    }

    const nextRole = role || user.role;
    const nextLicenseId = licenseId !== undefined ? licenseId : user.licenseId;
    const nextStaffId = staffId !== undefined ? staffId : user.staffId;
    const credentialError = validateRoleCredential({
      role: nextRole,
      licenseId: nextLicenseId,
      staffId: nextStaffId
    });

    if (credentialError) {
      return res.status(400).json({ message: credentialError });
    }

    if (licenseId !== undefined || nextRole !== "doctor") {
      updates.licenseId = nextRole === "doctor" ? licenseId : null;
    }

    if (staffId !== undefined || nextRole !== "staff") {
      updates.staffId = nextRole === "staff" ? staffId : null;
    }

    if (patientId !== undefined || nextRole !== "patient") {
      updates.patientId = nextRole === "patient" ? patientId || null : null;
    }

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    await user.update(updates);
    res.json(serializeUser(user));
  } catch (error) {
    res.status(400).json({ message: "Failed to update user", error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ message: "You cannot delete your own account while logged in" });
    }

    await user.destroy();
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};
