const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const requireAuth = require("../../middleware/auth");

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
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({error: "Failed to fetch user"});
    }
})

module.exports = router;