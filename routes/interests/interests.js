const express = require("express");
const router = express.Router();
const Interest = require("../../models/interest");

/**
 * @route GET /interests
 * @desc Fetches all interests from the database.
 * This route calls the `getAllInterests` method from the `Interest` model to retrieve the list of interests.
 * If successful, it returns the list of interests. If an error occurs, it returns a 500 status with an error message.
 * 
 * @returns {Object} 200 - A JSON array containing all the interests from the database.
 * @returns {Object} 500 - An error message in case of a failure to retrieve the interests.
 */
router.get("/", async (req, res) => {
    try {
        await Interest.getAllInterests(req, res);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve interests." });
    }
});

module.exports = router;