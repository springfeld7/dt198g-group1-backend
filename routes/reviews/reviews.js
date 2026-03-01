const express = require("express");
const router = express.Router();
const Review = require("../../models/review");
const requireAuth = require("../../middleware/auth");

router.use(requireAuth);

/**
 * POST route for creating a new review.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} A JSON response indicating the success or failure of the request.
 * @throws {Error} Throws an error if any required fields are missing or if there is a server error.
 */
router.post("/", async (req, res) => {
  try {
    const { eventId, round, dateId, answers } = req.body;

    // Check if all required fields are provided
    if (!eventId || !round || !dateId || !answers) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const reviewer = req.user.id;

    // Create the review using the provided details
    await Review.createReview(reviewer, eventId, round, dateId, answers);

    // Respond with a success message
    res.status(201).json({ message: "Created" });
  } catch (error) {
    // Catch any errors and return a 500 server error
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
