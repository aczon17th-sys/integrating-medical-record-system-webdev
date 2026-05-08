const router = require("express").Router();

const {
  getAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment
} = require("../controllers/appointmentController");

router.get("/", getAppointments);
router.post("/", addAppointment);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

module.exports = router;
