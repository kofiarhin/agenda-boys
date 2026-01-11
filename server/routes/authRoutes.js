const { Router } = require("express");
const { registerUser } = require("../controllers/authControler");

const router = Router();

router.get("/", async (req, res, next) => {
  return res.json({ message: "get users" });
});

router.post("/register", registerUser);

module.exports = router;
