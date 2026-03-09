const express = require("express");
const router = express.Router();
const Event = require("../../models/event")
const reqAuth = require("../../middleware/auth")
const reqAdmin = require("../../middleware/adminAuth")
const {generateMatches} = require("../../services/matching-service");
const path = require("path");
const fs = require("fs");

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
            return res.status(404).json({error: "event not found"})
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});

/**
 * @route GET /events/:id/pictures
 * @desc Retrieve the picture of the event with the provided id
 *
 * This route fetches the event picture stored in the `resources/img/event/` folder.
 *
 * @param {string} id - Event ID passed in the URL
 *
 * @returns {file} 200 - Returns the event picture image file if found
 * @returns {json} 404 - Error message if the image is not found
 * @returns {json} 500 - Internal server error if trouble reading the file
 */
router.get("/:id/pictures", async (req, res) => {
    const {id} = req.params;
    try {
        const imgPath = path.join(__dirname, "../../resources/img/events", `${id}.jpg`);

        fs.stat(imgPath, (err, stats) => {
            if (err || !stats.isFile()) {
                return res.status(404).json({ error: "Event picture not found" });
            }
            res.sendFile(imgPath);
            });
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
})


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
 * @param {Object} body - Request body
 * @param {string} body.title - The name of the event
 * @param {string} body.description - The event description
 * @param {Date} body.date - The event date
 * @param {string} body.location - The event location
 * @param {number} body.maxSpots - Maximum number of participants (must be >= 1)
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
 * @route PUT /events
 * @desc Updates an event in the database
 *
 * This route updates an event to the database.
 * It returns the updated event in a JSON file.
 *
 * @param {string} id.path.required - The id of the event to update
 *
 * @param {Object} body.required - Event update object
 * @param {string} body.title - The name of the event
 * @param {string} body.description - The event description
 * @param {Date} body.date - The event date
 * @param {string} body.location - The event location
 * @param {number} body.maxSpots - Maximum number of participants (>= 1)
 *
 * @returns {json} 200 - JSON object of the updated event
 * @returns {error} 404 - event not found
 * @returns {Error} 500 - Internal server error from reading the database
 */
router.put("/:id", reqAdmin, async (req, res) => {
    try {
        const {id} = req.params;
        const event = await Event.getEventById(id);

        if (!event) {
            return res.status(404).json({error: "Event not found"});
        }
        const updatedEvent = await Event.updateEvent(event,req.body);

        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({error: "Failed to update event"});
    }
});

/**
 * @route DELETE /events/:id
 * @desc deletes an event from the database
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

/**
 * @route GET /:eventId/:round/match
 * @desc Generate and return matches and visualization snapshots for a round of an event
 * 
 * This route generates matches for a specific round of an event and provides
 * step-by-step snapshots of the score matrix for frontend visualization. Snapshots
 * include base interest similarity and detailed cell updates with breakdowns for
 * happiness and age adjustments.
 * 
 * @param {string} eventId.path.required - The ID of the event to generate matches for
 * @param {number} round.path.required - The round number (1, 2, or 3)
 * 
 * @returns {json} 200 - JSON object containing:
 *   - message: Informational string
 *   - matchedPairs: Array of generated match objects {man: ObjectId, woman: ObjectId}
 *   - snapshots: Array of base and update snapshots for visualization
 * @returns {error} 400 - Invalid round number
 * @returns {Error} 500 - Internal server error from reading the database or generating matches
 */
router.get("/:eventId/:round/match", reqAdmin, async (req, res) => {
     try {
        const { eventId, round } = req.params;
        const roundNum = Number(round);

        if (![1,2,3].includes(roundNum)) return res.status(400).json({ error: "Invalid round" });

        const { matchedPairs, snapshots } = await generateMatches(eventId, roundNum);
        res.status(200).json({ 
            message: `Round ${roundNum} matches generated`, 
            matchedPairs, 
            snapshots 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
