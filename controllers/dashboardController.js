const Appointment = require("../models/Appointment");
const Notification = require("../models/Notification");
const Patient = require("../models/Patient");
const { ensurePatientForUser } = require("../utils/patientAccount");

exports.getDashboard = async (req, res) => {
  try {
    if (req.user.role === "patient") {
      const patient = await ensurePatientForUser(req.user);
      const where = patient ? { patientId: patient.id } : { patientId: null };
      const [totalAppointments, recentAppointments, notifications] = await Promise.all([
        Appointment.count({ where }),
        Appointment.findAll({
          where,
          order: [["updatedAt", "DESC"]],
          limit: 5
        }),
        Notification.findAll({
          where: { patientId: patient ? patient.id : null, recipientRole: "patient" },
          order: [["createdAt", "DESC"]],
          limit: 8
        })
      ]);

      return res.json({
        totalPatients: patient ? 1 : 0,
        totalAppointments,
        recentActivities: [
          ...notifications.map((notification) => ({
            type: notification.type,
            text: `${notification.title}: ${notification.message}`,
            date: notification.createdAt
          })),
          ...recentAppointments.map((appointment) => ({
            type: "appointment",
            text: `Your appointment is ${appointment.status}`,
            date: appointment.updatedAt
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
      });
    }

    const [totalPatients, totalAppointments, recentPatients, recentAppointments, patients, staffNotifications] =
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
        }),
        Patient.findAll({ attributes: ["age", "gender", "createdAt"] }),
        req.user.role === "staff"
          ? Notification.findAll({
            where: { recipientRole: "staff" },
            order: [["createdAt", "DESC"]],
            limit: 8
          })
          : Promise.resolve([])
      ]);

    const ages = patients.map((patient) => Number(patient.age)).filter((age) => Number.isFinite(age) && age > 0);
    const averageAge = ages.length ? Number((ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1)) : 0;
    const genderCounts = patients.reduce((counts, patient) => {
      const gender = patient.gender || "Unspecified";
      counts[gender] = (counts[gender] || 0) + 1;
      return counts;
    }, {});
    const registrationsByMonth = patients.reduce((counts, patient) => {
      const date = new Date(patient.createdAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      counts[month] = (counts[month] || 0) + 1;
      return counts;
    }, {});

    const activities = [
      ...staffNotifications.map((notification) => ({
        type: notification.type,
        text: `${notification.title}: ${notification.message}`,
        date: notification.createdAt
      })),
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
      averageAge,
      genderCounts,
      registrationsByMonth,
      recentActivities: activities
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard", error: error.message });
  }
};
