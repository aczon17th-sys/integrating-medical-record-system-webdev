const Patient = require("../models/Patient");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

exports.getPatients = async (req, res) => {
  try {
    if (req.user.role === "patient") {
      const patient = await Patient.findByPk(req.user.patientId);
      return res.json(patient ? [patient] : []);
    }

    const { search } = req.query;
    const where = search
      ? {
          [Op.or]: [
            { fullname: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { validIdType: { [Op.like]: `%${search}%` } },
            { validIdNumber: { [Op.like]: `%${search}%` } },
            { gender: { [Op.like]: `%${search}%` } },
            { diagnosis: { [Op.like]: `%${search}%` } },
            { medications: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const patients = await Patient.findAll({
      where,
      order: [["createdAt", "DESC"]]
    });

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch patients", error: error.message });
  }
};

exports.getPatient = async (req, res) => {
  try {
    if (req.user.role === "patient" && Number(req.params.id) !== Number(req.user.patientId)) {
      return res.status(403).json({ message: "You can only view your own patient record" });
    }

    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch patient", error: error.message });
  }
};

exports.addPatient = async (req, res) => {
  try {
    const { accountEmail, accountPassword, validIdType, validIdNumber } = req.body;

    if (!validIdType || !validIdNumber) {
      return res.status(400).json({ message: "Valid ID type and ID number are required for patient verification" });
    }

    if (!accountEmail || !accountPassword) {
      return res.status(400).json({ message: "Patient email and password are required to create a patient login account" });
    }

    const existingUser = await User.findOne({ where: { email: accountEmail } });

    if (existingUser) {
      return res.status(409).json({ message: "A login account already exists for this email" });
    }

    const patient = await Patient.create({
      ...req.body,
      email: accountEmail
    });

    const user = await User.create({
      username: accountEmail,
      email: accountEmail,
      password: await bcrypt.hash(accountPassword, 10),
      role: "patient",
      patientId: patient.id
    });

    res.status(201).json({
      patient,
      account: {
        id: user.id,
        email: user.email,
        role: user.role,
        patientId: user.patientId
      }
    });
  } catch (error) {
    res.status(400).json({ message: "Failed to add patient", error: error.message });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const nextValidIdType = req.body.validIdType !== undefined ? req.body.validIdType : patient.validIdType;
    const nextValidIdNumber = req.body.validIdNumber !== undefined ? req.body.validIdNumber : patient.validIdNumber;

    if (!nextValidIdType || !nextValidIdNumber) {
      return res.status(400).json({ message: "Valid ID type and ID number are required for patient verification" });
    }

    await patient.update(req.body);
    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: "Failed to update patient", error: error.message });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await patient.destroy();
    res.json({ message: "Patient deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete patient", error: error.message });
  }
};
