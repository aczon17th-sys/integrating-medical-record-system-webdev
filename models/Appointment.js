const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Appointment = sequelize.define("Appointment", {
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  patientName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  appointmentDate: {
    type: DataTypes.DATEONLY
  },

  appointmentTime: {
    type: DataTypes.STRING
  },

  reason: {
    type: DataTypes.STRING
  },

  status: {
    type: DataTypes.ENUM("scheduled", "completed", "cancelled"),
    allowNull: false,
    defaultValue: "scheduled"
  }
});

module.exports = Appointment;
