const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const { hashPassword } = require('../../utils/password-hasher');

/**
 * Registers a new user account.
 *
 * @param {import("express").Request} req - Express request with user fields in body.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Resolves after sending the response.
 */
const registerUserHandler = async (req, res) => {
    try {
        const {
            username,
            password,
            repeatPassword,
            firstName,
            surname,
            email,
            phone,
            age,
            location,
            gender,
            interests
        } = req.body;

        // Validate passwords match
        if (password !== repeatPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        // Hash password
        const hashedPassword = await hashPassword(password.trim());

        // Create new user
        const user = await User.register({
            username,
            password: hashedPassword,
            firstName,
            surname,
            email,
            phone,
            age,
            location,
            gender,
            interests
        });

        // Remove password before sending
        const { password: _, ...safeUser } = user.toObject();
        res.status(201).json({ message: "User registered successfully", user: safeUser });

    } catch (err) {
        res.status(400).json({ error: "Failed to register" });
    }
};

router.post("/", registerUserHandler);

module.exports = router;
