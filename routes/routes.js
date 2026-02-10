const express = require("express");
const router = express.Router();

const authRoutes = require("./auth/auth");
const userRoutes = require("./users/users");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

router.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

module.exports = router;