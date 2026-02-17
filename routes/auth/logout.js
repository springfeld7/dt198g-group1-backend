const express = require("express");
const router = express.Router();
const requireAuth = require("../../middleware/auth");

//router.post("/", (req, res) => {
router.post("/", requireAuth, (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: "Failed to log out" });
            }

            res.status(200).json({ message: "Logged out successfully" });
        });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

module.exports = router;
