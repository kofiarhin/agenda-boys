const User = require("../models/user.model");

const registerUser = async (req, res, next) => {
  try {
    const { firstName, email, clerkId, imageUrl, lastName } = req.body;

    const user = await User.create({
      firstName,
      lastName,
      imageUrl,
      clerkId,
      email,
    });

    console.log({ user });
    return res.json(user);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
};
