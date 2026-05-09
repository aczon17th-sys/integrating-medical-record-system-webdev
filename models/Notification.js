const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Notification = sequelize.define("Notification", {
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  recipientRole: {
    type: DataTypes.ENUM("admin", "doctor", "staff", "patient"),
    allowNull: true
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false
  },

  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "info"
  },

  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

module.exports = Notification;
