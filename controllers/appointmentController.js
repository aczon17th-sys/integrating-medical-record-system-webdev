const Appointment = require("../models/Appointment");
const Notification = require("../models/Notification");
const Patient = require("../models/Patient");
const { ensurePatientForUser } = require("../utils/patientAccount");
const { Op } = require("sequelize");

const activeAppointmentStatuses = ["requested", "scheduled"];

const resolveAppointmentPatient = async (payload) => {
  if (payload.patientId) {
    const patient = await Patient.findByPk(payload.patientId);
    return patient ? { patientId: patient.id, patientName: patient.fullname } : null;
  }

  if (payload.patientName) {
    const patient = await Patient.findOne({ where: { fullname: payload.patientName } });
    return patient ? { patientId: patient.id, patientName: patient.fullname } : null;
  }

  return null;
};

const hasScheduleConflict = async ({ appointmentDate, appointmentTime, excludeId = null }) => {
  if (!appointmentDate || !appointmentTime) {
    return false;
  }

  const where = {
    appointmentDate,
    appointmentTime,
    status: { [Op.in]: activeAppointmentStatuses }
  };

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  return Boolean(await Appointment.findOne({ where }));
};

exports.getAppointments = async (req, res) => {
  try {
    if (req.user.role === "patient") {
      const patient = await ensurePatientForUser(req.user);
      const appointments = patient
        ? await Appointment.findAll({
          where: { patientId: patient.id },
          order: [
            ["appointmentDate", "ASC"],
            ["appointmentTime", "ASC"]
          ]
        })
        : [];

      return res.json(appointments);
    }

    const appointments = await Appointment.findAll({
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
      const patient = await ensurePatientForUser(req.user);

      if (!patient) {
        return res.status(403).json({ message: "Unable to prepare your patient record" });
      }

      payload.patientId = patient.id;
      payload.patientName = patient.fullname;
      payload.status = "requested";
    } else {
      const appointmentPatient = await resolveAppointmentPatient(payload);

      if (!appointmentPatient) {
        return res.status(400).json({ message: "A valid patient record is required for appointments" });
      }

      payload.patientId = appointmentPatient.patientId;
      payload.patientName = appointmentPatient.patientName;
      payload.status = payload.status || "scheduled";
    }

    if (activeAppointmentStatuses.includes(payload.status) && await hasScheduleConflict(payload)) {
      return res.status(409).json({ message: "This date and time already has an active appointment" });
    }

    const appointment = await Appointment.create(payload);

    if (req.user.role !== "patient") {
      await Notification.create({
        patientId: appointment.patientId,
        recipientRole: "patient",
        title: "Appointment scheduled",
        message: `Your ${appointment.reason || "follow-up"} appointment is scheduled on ${appointment.appointmentDate || "the selected date"} at ${appointment.appointmentTime || "the selected time"}.`,
        type: "appointment"
      });
    }

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
      const patient = await ensurePatientForUser(req.user);

      if (!patient || Number(appointment.patientId) !== Number(patient.id)) {
        return res.status(403).json({ message: "You can only cancel your own appointment" });
      }

      if (req.body.status !== "cancelled") {
        return res.status(403).json({ message: "Patients can only cancel appointments" });
      }

      await appointment.update({ status: "cancelled" });
      return res.json(appointment);
    }

    const updates = { ...req.body };

    const nextStatus = updates.status || appointment.status;

    if (
      activeAppointmentStatuses.includes(nextStatus) &&
      await hasScheduleConflict({
        appointmentDate: updates.appointmentDate || appointment.appointmentDate,
        appointmentTime: updates.appointmentTime || appointment.appointmentTime,
        excludeId: appointment.id
      })
    ) {
      return res.status(409).json({ message: "This date and time already has an active appointment" });
    }

    await appointment.update(updates);

    if (updates.status === "scheduled" || updates.status === "cancelled") {
      await Notification.create({
        patientId: appointment.patientId,
        recipientRole: "patient",
        title: updates.status === "cancelled" ? "Appointment cancelled" : "Appointment updated",
        message: `Your appointment status is now ${appointment.status}.`,
        type: "appointment"
      });
    }

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
