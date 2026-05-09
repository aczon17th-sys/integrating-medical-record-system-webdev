const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MedicalRecord = sequelize.define("MedicalRecord", {
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  patientName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  doctorName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  prescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  therapies: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  medications: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  followUpNeeded: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },

  followUpNote: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = MedicalRecord;
