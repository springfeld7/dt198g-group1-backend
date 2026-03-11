const express = require("express");
const router = express.Router();
const Event = require("../../models/event")
const reqAuth = require("../../middleware/auth")
const reqAdmin = require("../../middleware/adminAuth")
const { generateMatches } = require("../../services/matching-service");
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
        res.status(500).json({ error: "Failed to fetch events" });
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
    const { id } = req.params;
    const isAdmin = req.session?.user?.isAdmin === true;

    try {
        let query = Event.findById(id);

        if (isAdmin) {
            query = query
                .populate({
                    path: 'registeredMen',
                    select: '_id username firstName surname email phone age location gender interests'
                })
                .populate({
                    path: 'registeredWomen',
                    select: '_id username firstName surname email phone age location gender interests'
                });
        }

        const event = await query.exec();
        if (!event) return res.status(404).json({ error: "event not found" });

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
    const { id } = req.params;
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
    const { id } = req.params;
    try {
        const { id: userId, gender } = req.session.user;
        const event = await Event.getEventById(id);
        if (!event) {
            return res.status(404).json({ message: "event not found" })
        }
        const updatedEvent = await Event.registerForEvent(event, userId, gender);
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
    const { id } = req.params;
    try {
        const { id: userId, gender } = req.session.user;
        const event = await Event.getEventById(id);
        if (!event) {
            return res.status(404).json({ message: "event not found" })
        }

        const updatedEvent = await Event.unRegisterForEvent(event, userId, gender);
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        const { title, description, date, location, maxSpots } = req.body;
        const eventDate = new Date(date);

        const existingEvent = await Event.findOne({
            title,
            description,
            date: eventDate,
            location,
            maxSpots,
        });
        if (existingEvent) {
            return res.status(409).json({ error: "Event already exists" });
        }
        const event = await Event.createEvent(title, description, date, location, maxSpots);

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ error: "Failed to create event" });
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
        const { id } = req.params;
        const event = await Event.getEventById(id);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        const updatedEvent = await Event.updateEvent(event, req.body);

        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ error: "Failed to update event" });
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
    const { id } = req.params;
    try {
        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ error: "Event not found" });

        await Event.delete(id)
        res.status(200).json({ message: "Event deleted", event });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete event" });
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

        if (![1, 2, 3].includes(roundNum)) return res.status(400).json({ error: "Invalid round" });

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

/**
 * @route POST /events/:eventId/:round/matches
 * @desc Save finalized matches and seating assignments for a specific round of an event
 *
 * This route is used by an organizer to persist the finalized seating layout
 * for a round after reviewing or modifying the generated matches. The request
 * must contain the match pairings along with their assigned table and seat
 * positions. Each match is stored as a Match document, and the created Match
 * IDs are stored in the corresponding round field of the Event document
 * (`pairsFirstRound`, `pairsSecondRound`, or `pairsThirdRound`).
 *
 * @param {string} eventId.path.required - The ID of the event whose matches are being saved
 * @param {number} round.path.required - The round number (1, 2, or 3)
 *
 * @param {Object} body.required - Request body containing finalized matches
 * @param {Array<Object>} body.matches - Array of match objects
 * @param {string} body.matches[].man - The user ID of the male participant
 * @param {string} body.matches[].woman - The user ID of the female participant
 * @param {number} body.matches[].tableNumber - The table number assigned to this match
 * @param {string} body.matches[].manSeat - The seat position of the man ('left' or 'right')
 * @param {string} body.matches[].womanSeat - The seat position of the woman ('left' or 'right')
 *
 * @returns {json} 200 - JSON object containing a success message and the updated event document
 * @returns {error} 400 - Invalid round number provided
 * @returns {Error} 500 - Internal server error if saving matches fails
 */
router.post("/:eventId/:round/matches", reqAdmin, async (req, res) => {

    try {

        const { eventId, round } = req.params;
        const roundNum = Number(round);
        const { matches } = req.body;

        if (![1, 2, 3].includes(roundNum)) {
            return res.status(400).json({ error: "Invalid round" });
        }

        const event = await Event.saveRoundMatches(eventId, roundNum, matches);

        res.status(200).json({
            message: `Round ${roundNum} matches saved`,
            event
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /:eventId/:round/next-date
 * @desc Retrieve the next match for the current participant in a given round.
 *
 * If the participant is still in the registered list, returns {} to indicate polling.
 * If no matches exist for the round, also returns {} for polling.
 * Otherwise, returns the matched participant info including table and seat.
 *
 * @param {string} eventId.path.required - The ID of the event
 * @param {number} round.path.required - The round number (1, 2, or 3)
 *
 * @returns {json} 200 - JSON object containing the next match { user, tableNumber, seat }
 * @returns {error} 400 - Invalid round number
 * @returns {Error} 500 - Internal server error
 */
router.get('/:eventId/:round/next-date', async (req, res) => {
    try {
        const userId = req.user.id.toString();
        const { eventId, round } = req.params;
        const roundNum = Number(round);

        if (![1, 2, 3].includes(roundNum)) {
            return res.status(400).json({ error: 'Invalid round' });
        }

        // Map round number to field name
        const roundFieldMap = {
            1: 'pairsFirstRound',
            2: 'pairsSecondRound',
            3: 'pairsThirdRound'
        };
        const roundField = roundFieldMap[roundNum];

        const event = await Event.findById(eventId)
            .populate({
                path: roundField,
                populate: [
                    { path: 'man', select: '_id firstName surname interests', populate: { path: 'interests', select: 'name -_id' } },
                    { path: 'woman', select: '_id firstName surname interests', populate: { path: 'interests', select: 'name -_id' } },
                ],
            })
            .lean();

        if (!event) return res.status(404).json({ error: 'Event not found' });

        const isRegistered = event.registeredMen.some(id => id.toString() === userId) ||
            event.registeredWomen.some(id => id.toString() === userId);

        if (!isRegistered) {
            return res.status(403).json({ error: 'User is not registered for this event' });
        }

        // No matches populated yet -> return empty object
        if (!event[roundField] || event[roundField].length === 0) return res.json({});

        // Find the match that includes this user
        const match = event[roundField].find(m =>
            m.man._id.toString() === userId || m.woman._id.toString() === userId
        );

        if (!match) return res.status(404).json({ error: 'Match not found for this user' });

        // Determine the "other" participant and their seat
        const isMan = match.man._id.toString() === userId;
        const userMatch = isMan ? match.woman : match.man;
        const seat = isMan ? match.manSeat : match.womanSeat;

        // Build img URL
        const img = `/resources/img/users/${userMatch._id}.jpg`;

        res.json({
            user: {
                _id: userMatch._id,
                firstName: userMatch.firstName,
                surname: userMatch.surname,
                interests: userMatch.interests,
                img
            },
            tableNumber: match.tableNumber,
            seat
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
