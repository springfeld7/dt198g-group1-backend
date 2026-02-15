const express = require("express");
const { verifyPassword } = require("../../utils/password-hasher");
const router = express.Router();
const User = require("../../models/user");

router.get("/", (req, res) => {
    res.send("login");
});

router.post("/", async (req, res) => {
    try {
        const {
            username,
            password
        } = req.body;

        const user = await User.findOne({ username });
        
        if (!user || !(await verifyPassword(user.password, password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // TODO implement token

        return res.status(200).json({
          message: "Login successfull",
          user: {
            userId: user._id,
            username: user.username,
            isAdmin: user.isAdmin
          }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Something went wrong" });
    }
});

module.exports = router;
