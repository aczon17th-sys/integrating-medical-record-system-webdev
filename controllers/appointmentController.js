const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");

exports.getAppointments = async (req, res) => {
  try {
    const where = req.user.role === "patient" ? { patientId: req.user.patientId } : {};
    const appointments = await Appointment.findAll({
      where,
      order: [
        ["appointmentDate", "ASC"],
        ["appointmentTime", "ASC"]
      ]
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
  }
};

exports.addAppointment = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (req.user.role === "patient") {
      const patient = await Patient.findByPk(req.user.patientId);

      if (!patient) {
        return res.status(404).json({ message: "Patient record not found" });
      }

      payload.patientId = patient.id;
      payload.patientName = patient.fullname;
      payload.status = "scheduled";
    }

    const appointment = await Appointment.create(payload);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: "Failed to add appointment", error: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (req.user.role === "patient") {
      if (Number(appointment.patientId) !== Number(req.user.patientId)) {
        return res.status(403).json({ message: "You can only cancel your own appointment" });
      }

      if (req.body.status !== "cancelled") {
        return res.status(403).json({ message: "Patients can only cancel appointments" });
      }

      await appointment.update({ status: "cancelled" });
      return res.json(appointment);
    }

    await appointment.update(req.body);
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: "Failed to update appointment", error: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await appointment.destroy();
    res.json({ message: "Appointment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete appointment", error: error.message });
  }
};
