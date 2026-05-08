const router = require("express").Router();

const {
  getPatients,
  getPatient,
  addPatient,
  updatePatient,
  deletePatient
} = require("../controllers/patientController");

router.get("/", getPatients);
router.get("/:id", getPatient);
router.post("/", addPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

module.exports = router;
