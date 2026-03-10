const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Match = require("../../models/match");
const requireAuth = require("../../middleware/auth");
const fs = require("fs");
const path = require("path");
const {hashPassword} = require("../../utils/password-hasher");

router.use(requireAuth);

/**
 * @route GET /users/
 * @desc Retrieve all the users in the database
 *
 * This route fetches all users stored within the database.
 * It returns the users in a JSON file.
 *
 * @returns {json} 200 - JSON object of the specified user
 * @returns {Error} 500 - Internal server error if reading the database fails
 */
router.get("/", async (req, res) => {
    try {
        const users = await User.getUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({error: "Failed to fetch users"});
    }
});

/**
 * @route PUT /users/
 * @desc Updates a users in the database
 *
 * This route updates a user stored within the database.
 * It returns the updated users in a JSON file.
 *
 * @returns {json} 200 - JSON object of the updated user
 * @returns {json} 400 - If passwords are not matching
 * @returns {Error} 500 - Internal server error if reading the database fails
 */
router.put("/", async (req, res) => {
    try {
        if (req.body.password !== req.body.repeatPassword) {
            return res.status(400).json({error: "Passwords do not match"});
        }
        const hashedPassword = await hashPassword(req.body.password.trim());

        const users = await User.updateUser(req.session.user.id, req.body, hashedPassword);

        res.json(users);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

/**
 * @route GET /users/:id
 * @desc Retrieve the user by id in the database
 *
 * This route fetches a user stored within the database matching the id provided.
 * It returns the user in a JSON file.
 *
 * @returns {json} 200 - JSON object of the specified user
 * @returns {error} 404 - User not found.
 * @returns {Error} 500 - Internal server error if reading the database fails
 */
router.get("/:id", async (req, res) => {
    const {id} = req.params;
    try {
        const user = await User.getUserById(id)
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }
        const userWithImg = user.toObject();
        userWithImg.img = `/resources/img/users/${user._id}.jpg`;

        res.json(userWithImg);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch user"});
    }
});

/**
 * @route GET /users/:id/pictures
 * @desc Retrieve the profile picture of the user with the provided id
 *
 * This route fetches the profile picture stored in the `resources/img/users/` folder.
 * It checks if the user is authenticated and whether the picture exists.
 *
 * @param {string} id - User ID passed in the URL
 *
 * @returns {file} 200 - Returns the profile picture image file if found
 * @returns {json} 404 - Error message if the image is not found
 * @returns {json} 500 - Internal server error if trouble reading the file
 */
router.get("/:id/pictures", async (req, res) => {
    const {id} = req.params;

    try {
        const imgPath = path.join(__dirname, "../../resources/img/users", `${id}.jpg`);

        fs.stat(imgPath, (err, stats) => {
            if (err || !stats.isFile()) {
                return res.status(404).json({error: "Profile picture not found"});
            }

            res.sendFile(imgPath);
        });
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
})

/**
 * @route GET /users/:id/matches
 * @desc Retrieve the matches for the user matching the id
 *
 * This route fetches a users matches stored within the database matching the id provided.
 * It returns the users matches in a JSON file.
 *
 * @returns {json} 200 - JSON object of the users matches
 * @returns {Error} 500 - Internal server error if reading the database fails
 */
router.get("/:id/matches", async (req, res) => {
    const {id} = req.params;
    try {
        const matches = await User.getMatches(id)
        res.json(matches);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch matches"});
    }
})

/**
 * @route PUT /users/:id/matches
 * @desc Toggles the like of the match and the intent to share details.
 *
 * This route updates the match with the boolean representing like status, if mutual the match is added.
 * It returns the updated match in a JSON file.
 *
 * @returns {json} 200 - JSON object of the users match
 * @returns {json} 404 - Match not found error
 * @returns {Error} 500 - Internal server error if reading the database fails
 */
router.put("/:id/matches", async (req, res) => {
    const {id} = req.params;
    const {matchId, liked} = req.body
    try {
        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({message: 'Match not found'});
        }
        const matches = await User.addMatch(id, match, liked)
        res.json(matches);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
})

/**
 * @route PATCH /users/:id/matches/seen
 * @desc Mark all matches as seen for the user matching the id
 *
 * This route updates the matches for a user in the database matching the id provided,
 * setting the isSeen status of all their matches to true.
 *
 * @returns {json} 200 - Success message
 * @returns {Error} 500 - Internal server error if updating the database fails
 */
router.patch("/:id/matches/seen", async (req, res) => {
    const {id} = req.params;
    try {
        await User.markMatchesAsSeen(id);
        res.json({message: "Matches marked as seen"});
    } catch (error) {
        res.status(500).json({error: "Failed to update seen status"});
    }
})

/**
 * @route DELETE /api/v1/users/matches/:id
 * @desc Remove a specific match for an authenticated user
 *
 * This route identifies the authenticated user via the session (req.user.id)
 * and removes the match ID provided in the payload from their matches array.
 *
 * @returns {json} 200 - Success message
 * @returns {Error} 401 - Unauthorized if user not authenticated
 * @returns {Error} 400 - Invalid ID payload
 * @returns {Error} 500 - Internal server error if database update fails
 */
router.delete("/matches/:id", async (req, res) => {
    const userId = req.user.id;
    const matchId = req.params.id;

    try {
        const result = await User.removeMatch(userId, matchId);

        if (result.modifiedCount === 0) {
            return res.status(400).json({error: "Match not found"});
        }

        res.status(200).json({message: "Match was successfully deleted"});
    } catch (error) {
        res.status(500).json({error: "Internal Server Error"});
    }
});

module.exports = router;