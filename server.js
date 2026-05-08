const express = require("express");
const cors = require("cors");
require("dotenv").config();

const sequelize = require("./config/db");

require("./models/User");
require("./models/Patient");
require("./models/Appointment");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

sequelize
  .authenticate()
  .then(() => console.log("MySQL Connected"))
  .catch((err) => console.log(err));

sequelize
  .sync({ alter: true })
  .then(() => console.log("Tables Synced"))
  .catch((err) => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/patients", authMiddleware, patientRoutes);
app.use("/api/appointments", authMiddleware, appointmentRoutes);

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
