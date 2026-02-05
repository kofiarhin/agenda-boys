const { getAuth } = require("@clerk/express");

const parseAdminIds = () =>
  String(process.env.ADMIN_CLERK_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

const requireAdmin = (req, res, next) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId || null;
  const admins = parseAdminIds();

  if (!clerkId || !admins.includes(clerkId)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return next();
};

module.exports = requireAdmin;
