const router = require("express").Router();
const {
  getMedicalRecords,
  createMedicalRecord
} = require("../controllers/medicalRecordController");
const authorizeRoles = require("../middleware/roleMiddleware");

router.get("/", authorizeRoles("admin", "doctor", "staff", "patient"), getMedicalRecords);
router.post("/", authorizeRoles("doctor"), createMedicalRecord);

module.exports = router;
