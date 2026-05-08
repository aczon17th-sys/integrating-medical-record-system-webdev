const router = require("express").Router();

const {
  getPatients,
  getPatient,
  addPatient,
  updatePatient,
  deletePatient
} = require("../controllers/patientController");
const authorizeRoles = require("../middleware/roleMiddleware");

router.get("/", getPatients);
router.get("/:id", getPatient);
router.post("/", authorizeRoles("admin", "staff"), addPatient);
router.put("/:id", authorizeRoles("admin", "staff"), updatePatient);
router.delete("/:id", authorizeRoles("admin"), deletePatient);

module.exports = router;
