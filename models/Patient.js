const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Patient = sequelize.define("Patient", {
  fullname: {
    type: DataTypes.STRING,
    allowNull: false
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
