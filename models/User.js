const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },

  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  role: {
    type: DataTypes.ENUM("admin", "doctor", "staff", "patient"),
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
  },

  patientId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = User;
