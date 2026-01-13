// /server/controllers/authControler.js
const { getAuth } = require("@clerk/express");
const User = require("../models/user.model");

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, clerkId, imageUrl } = req.body || {};

    if (!clerkId || !email) {
      return res
        .status(400)
        .json({ message: "clerkId and email are required" });
    }

    const exists = await User.findOne({ clerkId }).lean();
    if (exists) return res.status(200).json(exists);

    const user = await User.create({
      firstName: firstName || "",
      lastName: lastName || "",
      imageUrl: imageUrl || "",
      clerkId,
      email,
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const syncUser = async (req, res) => {
  try {
    const auth = getAuth(req);
    const clerkIdFromToken = auth?.userId || null;

    if (!clerkIdFromToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { firstName, lastName, email, imageUrl } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const user = await User.findOneAndUpdate(
      { clerkId: clerkIdFromToken },
      {
        $set: {
          firstName: firstName || "",
          lastName: lastName || "",
          email,
          imageUrl: imageUrl || "",
        },
      },
      { new: true, upsert: true }
    ).lean();

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  syncUser,
};
