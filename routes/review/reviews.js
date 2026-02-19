const express = require("express");
const router = express.Router();
const Reviews = require("../../models/review");
const requireAuth = require("../../middleware/auth");


router.use(requireAuth);

/**
 * @route GET /review/
 * @desc Retrieve a review from the database
 *
 * This route fetches a review stored within the database.
 * It returns the review in a JSON file.
 *
 * @returns {json} 200 - JSON object of the review
 * @returns {Error} 500 - Internal server error if reading the database fails
 */
router.get("/", async (req, res) => {
    try {
        const review = await Reviews.getReview(req.session.user.id,req.body);
        res.json(review);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});


module.exports = router