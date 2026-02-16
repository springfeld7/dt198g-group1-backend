const express = require("express");
const router = express.Router();
const Question = require("../../models/question");
const requireAuth = require("../../middleware/auth");

router.use(requireAuth);

/**
 * @route GET /questions/
 * @desc Retrieve all the questions in the database
 *
 * This route fetches all questions stored within the database.
 * It returns the users in a JSON file.
 *
 * @returns {json} 200 - JSON object containing all questions
 * @returns {Error} 500 - Internal server error if reading the database fails
 */
router.get("/", async (req, res) => {
    try {
        const questions = await Question.getQuestions();
        res.json(questions);
    } catch (err) {
        res.status(500).json({error: "Failed to fetch questions"});
    }
});

module.exports = router;