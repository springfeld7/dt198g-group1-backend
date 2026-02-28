const express = require("express");
const router = express.Router();
const Review = require("../../models/review");
const requireAuth = require("../../middleware/auth");

router.use(requireAuth);

router.post("/", async (req, res) => {
    try {
        const { eventId, round, dateId, answers } = req.body;

        if (!eventId || !round || !dateId || !answers) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const reviewer = req.user.id;

        await Review.createReview(reviewer, eventId, round, dateId, answers);

        res.status(201).json({ message: "Created" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;