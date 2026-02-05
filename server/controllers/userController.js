const User = require("../models/user.model");

const normalizeList = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean)
    : [];

const getPreferences = async (req, res) => {
  try {
    const clerkId = req.userId;

    const user = await User.findOne({ clerkId })
      .select("preferredCategories preferredSources keywords")
      .lean();

    return res.json({
      preferredCategories: user?.preferredCategories || [],
      preferredSources: user?.preferredSources || [],
      keywords: user?.keywords || [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch preferences" });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const clerkId = req.userId;

    const preferredCategories = normalizeList(req.body?.preferredCategories);
    const preferredSources = normalizeList(req.body?.preferredSources);
    const keywords = normalizeList(req.body?.keywords);

    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        $set: {
          preferredCategories,
          preferredSources,
          keywords,
        },
      },
      { new: true, upsert: true }
    ).lean();

    return res.json({
      preferredCategories: user?.preferredCategories || [],
      preferredSources: user?.preferredSources || [],
      keywords: user?.keywords || [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update preferences" });
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
};
