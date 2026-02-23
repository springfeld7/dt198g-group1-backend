const express = require("express");
const router = express.Router();

const authRoutes = require("./auth/auth");
const userRoutes = require("./users/users");
const eventRoutes = require("./events/events");
const interestRoutes = require("./interests/interests");
const questionRoutes = require("./questions/questions");
const eventRoutes = require("./events/events");



router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/events", eventRoutes)
router.use("/interests", interestRoutes);
router.use("/questions", questionRoutes);

router.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

module.exports = router;