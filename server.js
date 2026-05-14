const express = require("express");
const cors = require("cors");
require("./config/env");

const sequelize = require("./config/db");
const { getJwtSecret } = require("./config/jwt");

require("./models/User");
require("./models/Patient");
require("./models/Appointment");
require("./models/Billing");
require("./models/MedicalRecord");
require("./models/Notification");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const billingRoutes = require("./routes/billingRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const { seedDefaultUsers } = require("./seedDefaultUsers");

const app = express();
getJwtSecret();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/patients", authMiddleware, patientRoutes);
app.use("/api/appointments", authMiddleware, appointmentRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/billings", authMiddleware, billingRoutes);
app.use("/api/medical-records", authMiddleware, medicalRecordRoutes);

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL Connected");

    await sequelize.sync({ alter: true });
    console.log("Tables Synced");

    await seedDefaultUsers();
    console.log("Default accounts ready");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
