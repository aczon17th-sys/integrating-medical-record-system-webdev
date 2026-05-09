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
    type: DataTypes.ENUM("requested", "scheduled", "completed", "cancelled", "rejected"),
    allowNull: false,
    defaultValue: "requested"
  },

  followUpNeeded: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },

  followUpForAppointmentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Appointment;
