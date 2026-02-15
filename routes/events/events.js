const express = require("express");
const router = express.Router();
const Event = require("../../models/event") 

router.get("/", async (req, res) => {
    try {
        const events = await Event.getEvents();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch events"});
    }
});

module.exports = router;