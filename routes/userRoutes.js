const router = require("express").Router();
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require("../controllers/userController");

router.use(authorizeRoles("admin"));

router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
