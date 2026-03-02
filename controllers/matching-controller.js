const { generateMatches } = require('../services/matching-service');

/**
 * Generate matches for a specific round of a speed-dating event.
 * 
 * @param {*} req - The request object containing the eventId and round number in the params
 * @param {*} res - The response object used to send back the generated matches or an error message
 * @returns {json} 201 - A JSON object containing a success message and the generated matches for the specified round
 * @returns {json} 400 - A JSON object containing an error message if the round number is invalid
 * @returns {json} 500 - A JSON object containing an error message if there was an issue generating the matches
 */
exports.generateRoundMatches = async (req, res) => {
    try {
        const { eventId, round } = req.params;
        if (![1,2,3].includes(Number(round))) return res.status(400).json({ error: "Invalid round" });

        const matches = await generateMatches(eventId, Number(round));
        res.status(201).json({ message: `Round ${round} matches generated`, matches });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};
