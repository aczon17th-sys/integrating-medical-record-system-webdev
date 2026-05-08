const router = require("express").Router();

const {
  getAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment
} = require("../controllers/appointmentController");
const authorizeRoles = require("../middleware/roleMiddleware");

router.get("/", getAppointments);
router.post("/", authorizeRoles("admin", "staff"), addAppointment);
router.put("/:id", authorizeRoles("admin", "doctor", "staff"), updateAppointment);
router.delete("/:id", authorizeRoles("admin"), deleteAppointment);

module.exports = router;
