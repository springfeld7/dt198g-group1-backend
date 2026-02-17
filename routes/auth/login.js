const express = require("express");
const { verifyPassword } = require("../../utils/password-hasher");
const router = express.Router();
const User = require("../../models/user");

router.get("/", (req, res) => {
    res.send("login");
});

/**
 * @route POST /auth/login
 * @desc Authenticates the user based on the provided username and password.
 * If successful, returns the user details (userId, username, isAdmin).
 * If authentication fails, returns a 401 status with an "Invalid credentials" error message.
 * @param {string} req.body.username - The username of the user trying to log in.
 * @param {string} req.body.password - The password entered by the user.
 * @returns {Object} 200 - Returns the user details (userId, username, isAdmin) if login is successful.
 * @returns {Object} 401 - Returns an error message "Invalid credentials" if login fails.
 * @returns {Object} 500 - Returns an error message if something goes wrong during the process.
 */
router.post("/", async (req, res) => {
    try {
      const { username, password } = req.body;
      // Check if the user exists in the database
      const user = await User.findOne({ username });
      // If no user found or the password doesn't match, return an error
      if (!user || !(await verifyPassword(user.password, password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

        return res.status(200).json({
            message: "Login successfull",
            user: {
                userId: user._id,
                username: user.username,
                isAdmin: user.isAdmin
            }
        });
    } catch (err) {
        return res.status(500).json({ error: "Something went wrong" });
    }
});

module.exports = router;
