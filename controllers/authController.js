const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op, QueryTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("../models/User");
const { ensurePatientForUser } = require("../utils/patientAccount");
const { getJwtSecret } = require("../config/jwt");

const BCRYPT_PREFIX = /^\$2[aby]\$/;

const normalizeRole = (role) => {
  if (["admin", "doctor", "patient", "staff"].includes(role)) {
    return role;
  }

  if (["nurse", "receptionist"].includes(role)) {
    return "staff";
  }

  return "staff";
};

const verifyPassword = async (plainPassword, storedPassword) => {
  if (!storedPassword) {
    return false;
  }

  if (BCRYPT_PREFIX.test(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  return plainPassword === storedPassword;
};

const findAppUser = (login) => {
  return User.findOne({
    where: {
      [Op.or]: [{ email: login }, { username: login }]
    }
  });
};

const findWorkbenchUser = async (login) => {
  try {
    const rows = await sequelize.query(
      [
        "SELECT id, role, first_name AS firstName, last_name AS lastName,",
        "email, password_hash AS passwordHash, is_active AS isActive",
        "FROM users WHERE email = :login LIMIT 1"
      ].join(" "),
      {
        replacements: { login },
        type: QueryTypes.SELECT
      }
    );

    return rows[0] || null;
  } catch (error) {
    if (["ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR"].includes(error.original?.code)) {
      return null;
    }

    throw error;
  }
};

const promoteWorkbenchUser = async (workbenchUser, plainPassword) => {
  const normalizedRole = normalizeRole(workbenchUser.role);
  const passwordHash = BCRYPT_PREFIX.test(workbenchUser.passwordHash)
    ? workbenchUser.passwordHash
    : await bcrypt.hash(plainPassword, 10);
  const username = workbenchUser.email ||
    [workbenchUser.firstName, workbenchUser.lastName].filter(Boolean).join(" ") ||
    `user-${workbenchUser.id}`;

  let user = await findAppUser(workbenchUser.email || username);

  if (user) {
    await user.update({
      username,
      email: workbenchUser.email || user.email,
      password: passwordHash,
      role: normalizedRole,
      licenseId: normalizedRole === "doctor" ? user.licenseId : null,
      staffId: normalizedRole === "staff" ? user.staffId || `WB-${workbenchUser.id}` : null,
      patientId: normalizedRole === "patient" ? user.patientId : null
    });
  } else {
    user = await User.create({
      username,
      email: workbenchUser.email,
      password: passwordHash,
      role: normalizedRole,
      staffId: normalizedRole === "staff" ? `WB-${workbenchUser.id}` : null
    });
  }

  if (!BCRYPT_PREFIX.test(workbenchUser.passwordHash)) {
    await sequelize.query(
      "UPDATE users SET password_hash = :passwordHash WHERE id = :id",
      {
        replacements: {
          id: workbenchUser.id,
          passwordHash
        }
      }
    );
  }

  return user;
};

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

    let user = await findAppUser(login);

    if (user && await verifyPassword(password, user.password)) {
      if (!BCRYPT_PREFIX.test(user.password)) {
        await user.update({ password: await bcrypt.hash(password, 10) });
      }

      if (user.role === "patient") {
        await ensurePatientForUser(user);
        await user.reload();
      }

      return res.json({
        token: createToken(user),
        user: serializeUser(user)
      });
    }

    const workbenchUser = await findWorkbenchUser(login);

    if (!workbenchUser) {
      return res.status(401).json({ message: "User not found" });
    }

    if (workbenchUser.isActive === 0 || workbenchUser.isActive === false) {
      return res.status(401).json({ message: "Account is inactive" });
    }

    if (!await verifyPassword(password, workbenchUser.passwordHash)) {
      return res.status(401).json({ message: "Invalid password" });
    }

    user = await promoteWorkbenchUser(workbenchUser, password);

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
