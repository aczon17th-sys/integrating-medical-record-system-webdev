const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");

exports.getDashboard = async (req, res) => {
  try {
    if (req.user.role === "patient") {
      const [patient, totalAppointments, recentAppointments] = await Promise.all([
        Patient.findByPk(req.user.patientId),
        Appointment.count({ where: { patientId: req.user.patientId } }),
        Appointment.findAll({
          where: { patientId: req.user.patientId },
          order: [["updatedAt", "DESC"]],
          limit: 5
        })
      ]);

      return res.json({
        totalPatients: patient ? 1 : 0,
        totalAppointments,
        recentActivities: recentAppointments.map((appointment) => ({
          type: "appointment",
          text: `Your appointment is ${appointment.status}`,
          date: appointment.updatedAt
        }))
      });
    }

    const [totalPatients, totalAppointments, recentPatients, recentAppointments] =
      await Promise.all([
        Patient.count(),
        Appointment.count(),
        Patient.findAll({
          order: [["createdAt", "DESC"]],
          limit: 5
        }),
        Appointment.findAll({
          order: [["updatedAt", "DESC"]],
          limit: 5
        })
      ]);

    const activities = [
      ...recentPatients.map((patient) => ({
        type: "patient",
        text: `Patient record for ${patient.fullname} was updated`,
        date: patient.updatedAt
      })),
      ...recentAppointments.map((appointment) => ({
        type: "appointment",
        text: `${appointment.patientName} appointment is ${appointment.status}`,
        date: appointment.updatedAt
      }))
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    res.json({
      totalPatients,
      totalAppointments,
      recentActivities: activities
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard", error: error.message });
  }
};
