const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.send("all users");
});

router.get("/:id", (req, res) => {
    const { id } = req.params;

    res.send(`Get user with id ${id}`);
})

module.exports = router;