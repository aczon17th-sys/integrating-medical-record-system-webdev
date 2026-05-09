const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const Notification = require("../models/Notification");
const Patient = require("../models/Patient");
const User = require("../models/User");
const { ensurePatientForUser } = require("../utils/patientAccount");

const doctorDisplayName = (doctor) => doctor.username || doctor.email || `Doctor ${doctor.id}`;

exports.getMedicalRecords = async (req, res) => {
  try {
    const where = {};

    if (req.user.role === "doctor") {
      where.doctorId = req.user.id;
    }

    if (req.user.role === "patient") {
      const patient = await ensurePatientForUser(req.user);
      where.patientId = patient ? patient.id : null;
    }

    const records = await MedicalRecord.findAll({
      where,
      order: [["createdAt", "DESC"]]
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch medical records", error: error.message });
  }
};

exports.createMedicalRecord = async (req, res) => {
  try {
    const { appointmentId, diagnosis, prescription, therapies, medications, followUpNeeded, followUpNote } = req.body;

    if (!appointmentId || !diagnosis || !prescription) {
      return res.status(400).json({ message: "Appointment, diagnosis, and prescription are required" });
    }

    const appointment = await Appointment.findByPk(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!["scheduled", "completed"].includes(appointment.status)) {
      return res.status(400).json({ message: "Only approved appointments can receive a diagnosis" });
    }

    const doctor = await User.findByPk(req.user.id);
    const patient = await Patient.findByPk(appointment.patientId);

    if (!doctor || !patient) {
      return res.status(404).json({ message: "Doctor or patient record not found" });
    }

    const record = await MedicalRecord.create({
      patientId: patient.id,
      patientName: patient.fullname,
      doctorId: doctor.id,
      doctorName: doctorDisplayName(doctor),
      appointmentId: appointment.id,
      diagnosis,
      prescription,
      therapies: therapies || null,
      medications: medications || null,
      followUpNeeded: Boolean(followUpNeeded),
      followUpNote: followUpNote || null
    });

    await Promise.all([
      appointment.update({ status: "completed" }),
      patient.update({
        diagnosis,
        prescription,
        medications: [medications, therapies].filter(Boolean).join("\n\nTherapies:\n") || patient.medications,
        followUpNeeded: Boolean(followUpNeeded),
        followUpNote: followUpNote || null
      }),
      Notification.create({
        patientId: patient.id,
        recipientRole: "patient",
        title: "Medication and prescription updated",
        message: `Dr. ${doctorDisplayName(doctor)} added your diagnosis, prescription, and medication instructions.`,
        type: "medication"
      }),
      Boolean(followUpNeeded)
        ? Notification.create({
          patientId: patient.id,
          recipientRole: "staff",
          title: "Follow-up check-up needed",
          message: `${patient.fullname} needs a follow-up check-up. ${followUpNote || ""}`.trim(),
          type: "follow_up"
        })
        : Promise.resolve()
    ]);

    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: "Failed to save medical record", error: error.message });
  }
};
