const { Router } = require("express");
const requireClerkAuth = require("../middleware/requireClerkAuth");
const {
  getPreferences,
  updatePreferences,
} = require("../controllers/userController");

const router = Router();

router.get("/preferences", requireClerkAuth, getPreferences);
router.put("/preferences", requireClerkAuth, updatePreferences);

module.exports = router;
