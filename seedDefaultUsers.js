const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const User = require("./models/User");

const defaultUsers = [
  {
    username: "admin",
    email: "admin@medicalsystem.local",
    password: "Admin@123",
    role: "admin",
    licenseId: null,
    staffId: null
  },
  {
    username: "doctor",
    email: "doctor@medicalsystem.local",
    password: "Doctor@123",
    role: "doctor",
    licenseId: "MD-0001",
    staffId: null
  },
  {
    username: "staff",
    email: "staff@medicalsystem.local",
    password: "Staff@123",
    role: "staff",
    licenseId: null,
    staffId: "STF-0001"
  }
];

const seedDefaultUsers = async () => {
  for (const account of defaultUsers) {
    const hashedPassword = await bcrypt.hash(account.password, 10);
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: account.username },
          { email: account.email }
        ]
      }
    });

    if (user) {
      await user.update({
        username: account.username,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        licenseId: account.licenseId,
        staffId: account.staffId
      });
    } else {
      await User.create({
        username: account.username,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        licenseId: account.licenseId,
        staffId: account.staffId
      });
    }
  }
};

module.exports = {
  defaultUsers,
  seedDefaultUsers
};
