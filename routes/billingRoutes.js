const router = require("express").Router();
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  getBillings,
  createBilling,
  updateBilling,
  deleteBilling
} = require("../controllers/billingController");

router.get("/", getBillings);
router.post("/", authorizeRoles("admin", "staff"), createBilling);
router.put("/:id", authorizeRoles("admin", "staff"), updateBilling);
router.delete("/:id", authorizeRoles("admin"), deleteBilling);

module.exports = router;
