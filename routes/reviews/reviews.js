const express = require("express");
const router = express.Router();
const Review = require("../../models/review");
const Event = require("../../models/event");
const requireAuth = require("../../middleware/auth");

router.use(requireAuth);

/**
 * @route POST /reviews
 * @desc Create a review for a match and update the match in the event
 *
 * This route creates a Review document and adds it to the correct Match in the Event.
 *
 * @body {string} eventId - The event ID
 * @body {number} round - The round number (1, 2, or 3)
 * @body {string} dateId - The ID of the date being reviewed
 * @body {object} answers - The answers map
 *
 * @returns {json} 201 - Success message
 * @returns {json} 400 - Missing fields
 * @returns {json} 404 - Event or Match not found
 * @returns {json} 500 - Internal server error
 */
router.post("/", async (req, res) => {
  try {
    const { eventId, round, dateId, answers } = req.body;
    const reviewer = req.user.id;

    if (!eventId || !round || !dateId || !answers) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the event
    const event = await Event.findById(eventId)
      .populate("pairsFirstRound")
      .populate("pairsSecondRound")
      .populate("pairsThirdRound")
      .exec();
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Determine which round array to use
    let roundArray;
    if (round === 1) roundArray = event.pairsFirstRound;
    else if (round === 2) roundArray = event.pairsSecondRound;
    else if (round === 3) roundArray = event.pairsThirdRound;
    else return res.status(400).json({ error: "Invalid round number" });

    // Find the Match involving the reviewer and date
    const match = roundArray.find((m) =>
      (m.man.toString() === reviewer && m.woman.toString() === dateId) ||
      (m.woman.toString() === reviewer && m.man.toString() === dateId)
    );
    if (!match) return res.status(404).json({ error: "Match not found" });

    // Create the Review
    const review = await Review.createReview(reviewer, eventId, round, dateId, answers);

    // Add the review to the Match and save
    match.reviews.push(review._id);
    await match.save();

    res.status(201).json({ message: "Review created and match updated", reviewId: review._id });
  } catch (error) {
    console.error("Failed to create review:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
