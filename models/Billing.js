const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Billing = sequelize.define("Billing", {
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  patientName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  statementDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  serviceDescription: {
    type: DataTypes.STRING,
    allowNull: false
  },

  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },

  philhealthId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  seniorCitizenId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  pwdId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  discountType: {
    type: DataTypes.ENUM("none", "philhealth", "senior", "pwd"),
    allowNull: false,
    defaultValue: "none"
  },

  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },

  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },

  paymentMethod: {
    type: DataTypes.ENUM("cash", "online_banking", "ewallet"),
    allowNull: false,
    defaultValue: "cash"
  },

  paymentStatus: {
    type: DataTypes.ENUM("unpaid", "paid"),
    allowNull: false,
    defaultValue: "unpaid"
  }
});

module.exports = Billing;
