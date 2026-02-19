const express = require("express");
const router = express.Router();

const authRoutes = require("./auth/auth");
const userRoutes = require("./users/users");
const interestRoutes = require("./interests/interests");
const questionRoutes = require("./questions/questions");
const eventRoutes = require("./events/events");
const reviewRoutes = require("./review/reviews");



router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/events", eventRoutes)
router.use("/interests", interestRoutes);
router.use("/questions", questionRoutes);
router.use("/reviews", reviewRoutes);

router.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

module.exports = router;