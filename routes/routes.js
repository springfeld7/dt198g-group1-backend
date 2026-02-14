const express = require("express");
const router = express.Router();

const authRoutes = require("./auth/auth");
const userRoutes = require("./users/users");
const interestRoutes = require("./interests/interests");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/interests", interestRoutes);

router.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

module.exports = router;