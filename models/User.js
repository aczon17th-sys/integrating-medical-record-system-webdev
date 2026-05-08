const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  role: {
    type: DataTypes.ENUM("admin", "doctor", "staff"),
    allowNull: false,
    defaultValue: "staff"
  },

  licenseId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  staffId: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = User;
