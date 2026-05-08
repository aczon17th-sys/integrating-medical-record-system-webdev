const express = require("express");
const cors = require("cors");
require("dotenv").config();

const sequelize = require("./config/db");

require("./models/Patient");
require("./models/Appointment");

const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

sequelize
  .authenticate()
  .then(() => console.log("MySQL Connected"))
  .catch((err) => console.log(err));

sequelize
  .sync({ alter: true })
  .then(() => console.log("Tables Synced"))
  .catch((err) => console.log(err));

app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/", (req, res) => {
  res.send("Medical System API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
