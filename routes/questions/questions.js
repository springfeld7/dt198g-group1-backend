const express = require("express");
const router = express.Router();
const Question = require("../../models/question");
const requireAuth = require("../../middleware/auth");

router.use(requireAuth);

router.get("/", async (req, res) => {
    try {
        const questions = await Question.getQuestions();
        res.json(questions);
    } catch (err) {
        res.status(500).json({error: "Failed to fetch questions"});
    }
});

module.exports = router;