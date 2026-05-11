const router = require("express").Router();
const {
  getMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord
} = require("../controllers/medicalRecordController");
const authorizeRoles = require("../middleware/roleMiddleware");

router.get("/", authorizeRoles("admin", "doctor", "staff", "patient"), getMedicalRecords);
router.post("/", authorizeRoles("admin", "doctor"), createMedicalRecord);
router.put("/:id", authorizeRoles("admin", "doctor"), updateMedicalRecord);
router.delete("/:id", authorizeRoles("admin"), deleteMedicalRecord);

module.exports = router;
