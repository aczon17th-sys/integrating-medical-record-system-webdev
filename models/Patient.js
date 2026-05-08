const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Patient = sequelize.define("Patient", {
  fullname: {
    type: DataTypes.STRING,
    allowNull: false
  },

  validIdType: {
    type: DataTypes.STRING,
    allowNull: true
  },

  validIdNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },

  identityVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },

  age: {
    type: DataTypes.INTEGER
  },

  gender: {
    type: DataTypes.STRING
  },

  diagnosis: {
    type: DataTypes.STRING
  },

  medications: {
    type: DataTypes.STRING
  }
});

module.exports = Patient;
