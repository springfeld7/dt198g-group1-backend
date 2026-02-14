const express = require("express");
const router = express.Router();
const Interest = require("../../models/interest");

router.get("/", async (req, res) => {
    try {
        await Interest.getAllInterests(req, res);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve interests." });
    }
});

module.exports = router;