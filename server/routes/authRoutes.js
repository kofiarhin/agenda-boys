const { Router } = require("express");
const { registerUser, syncUser } = require("../controllers/authControler");
const requireClerkAuth = require("../middleware/requireClerkAuth");

const router = Router();

router.get("/", async (req, res) => {
  return res.json({ message: "get users" });
});

// signup flow (your existing)
router.post("/register", registerUser);

// signin flow (auto-create/update user after login)
router.post("/sync-user", requireClerkAuth, syncUser);

module.exports = router;
