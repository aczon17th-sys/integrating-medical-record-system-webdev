const Patient = require("../models/Patient");
const { Op } = require("sequelize");

exports.getPatients = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search
      ? {
          [Op.or]: [
            { fullname: { [Op.like]: `%${search}%` } },
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
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
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
