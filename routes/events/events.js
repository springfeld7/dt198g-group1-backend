const express = require("express");
const router = express.Router();
const Event = require("../../models/event")
const reqAuth = require("../../middleware/auth")
const reqAdmin = require("../../middleware/adminAuth")

router.use(reqAuth);
/**
 * @route GET /events/
 * @desc Retrieve the events in the database
 *
 * This route fetches all events stored within the database.
 * It returns the events in a JSON file.
 *
 * @returns {json} 200 - JSON object of all events
 * @returns {Error} 500 - Internal server error if reading the database fails
 */
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

/**
 * @route GET /events/:id
 * @desc Retrieve the event by id in the database
 *
 * This route fetches an event stored within the database matching the id provided.
 * It returns the user in a JSON file.
 *
 * @param {string} id.path.required - The id of the event to retrieve
 *
 * @returns {json} 200 - JSON object of the specified event
 * @returns {error} 404 - event not found.
 * @returns {Error} 500 - Internal server error if reading the database fails
 */
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

/**
 * @route POST /events/:id/register
 * @desc Register to the event by id in the database
 *
 * This route register a user to an event stored within the database matching the id provided.
 * It returns the event in a JSON file.
 *
 * @param {string} id.path.required - The id of the event to update
 *
 * @returns {json} 200 - JSON object of the specified updated event
 * @returns {error} 404 - event not found.
 * @returns {Error} 500 - Internal server error if reading the database fails failure to register
 */
router.post("/:id/register", async (req, res) => {
    const {id} = req.params;
    try {
        const {id: userId, gender} = req.session.user;
        const event = await Event.getEventById(id);
        if (!event) {
            return res.status(404).json({message: "event not found"})
        }
        const updatedEvent = await Event.registerForEvent(event, userId, gender);
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
})

/**
 * @route DELETE /events/:id/register
 * @desc Unregister to the event by id in the database
 *
 * This route unregister a user to an event stored within the database matching the id provided.
 * It returns the event in a JSON file.
 *
 * @param {string} id.path.required - The id of the event to update
 *
 * @returns {json} 200 - JSON object of the specified updated event
 * @returns {error} 404 - event not found.
 * @returns {Error} 500 - Internal server error if reading the database fails or failure to unregister
 */
router.delete("/:id/register", async (req, res) => {
    const {id} = req.params;
    try {
        const {id: userId, gender} = req.session.user;
        const event = await Event.getEventById(id);
        if (!event) {
            return res.status(404).json({message: "event not found"})
        }

        const updatedEvent = await Event.unRegisterForEvent(event, userId, gender);
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
})


/**
 * @route POST /events
 * @desc Post a new event to the database
 *
 * This route posts a new event to the database.
 * It returns the event in a JSON file.
 *
 * @param {object} body - Request body object containing title,description, location and maxSpots
 *
 * @returns {json} 201 - JSON object of the created event
 * @returns {error} 409 - event already exist
 * @returns {Error} 500 - Internal server error from reading the database
 */
router.post("/", reqAdmin, async (req, res) => {
    try {
        const {title, description, date, location, maxSpots} = req.body;
        const eventDate = new Date(date);

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
        const event = await Event.createEvent(title,description, date, location, maxSpots);

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({error: "Failed to create event"});
    }
});

/**
 * @route DELETE /events/:id
 * @desc deletes a event from the database
 *
 * This route deletes an event from the database.
 * It returns the event in a JSON file.
 *
 * @param {string} id.path.required - The id of the event to update
 *
 * @returns {json} 200 - JSON object of the deleted event
 * @returns {error} 404 - event not found
 * @returns {Error} 500 - Internal server error from reading the database
 */
router.delete("/:id", reqAdmin, async (req, res) => {
    const {id} = req.params;
    try {
        const event = await Event.findById(id);
        if (!event) return res.status(404).json({error: "Event not found"});

        await Event.delete(id)
        res.status(200).json({message: "Event deleted", event});
    } catch (error) {
        res.status(500).json({error: "Failed to delete event"});
    }
});

module.exports = router;