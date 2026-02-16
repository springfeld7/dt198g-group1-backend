const express = require("express");
const router = express.Router();
const Event = require("../../models/event") 
const reqAuth = require("../../middleware/auth")

// Get all events. Only send lists if authenticated, otherwise just events info
router.get("/", async (req, res) => {

    try {
        const query = Event.find();
        if (!req.session?.user) {
            query.select(
                "-registeredMen -registeredWomen -pairsFirstRound -pairsSecondRound -pairsThirdRound"
            );
        }
        const events = await query;
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch events"});
    }
});

router.use(reqAuth);

// get event by id
router.get("/:id", async (req, res) => {
    const {id} = req.params;
    try {
        const event = await Event.getEventById(id);
        if (!event) {
            return res.status(404).json({message: "event not found"})
        }

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch event"});
    }
});

// post event
router.post("/", async (req, res) => {
    try {
        const { title, description, date, location, maxSpots } = req.body;
        const eventDate = new Date(date);

        // check if event exists
        const existingEvent = await Event.findOne({
            title,
            description,
            date: eventDate,
            location,
            maxSpots,
        });
        if (existingEvent) {
            return res.status(409).json({error: "Event already exists"});
        }

        const event = await Event.create({
            title,
            description,
            date: eventDate,
            location,
            maxSpots,
            registeredMen: [],
            registeredWomen: [],
            pairsFirstRound: [],
            pairsSecondRound: [],
            pairsThirdRound: [],
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({error: "Failed to create event"});
    }
});

module.exports = router;