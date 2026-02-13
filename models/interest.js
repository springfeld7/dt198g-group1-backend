const mongoose = require('mongoose');

/**
 * Interest Schema for interacting with the interest database.
 *
 * This schema defines the structure of interest in the database.
 *
 * @schema Interest
 * @property {String} name - Name of the interest
 */
const InterestSchema = new mongoose.Schema({
    name: { type: String, required: true },
})

/**
 * @route GET /interests/
 * @desc Retrieve all interests in the database
 *
 * This route fetches all interests stored within the database.
 * It returns the interests in a JSON file.
 *
 * @returns {json} 200 - JSON object of all interests
 * @returns {Error} 500 - Internal server error if reading the database fails
 */
InterestSchema.statics.getAllInterests = async function (req, res) {
    try{
        const interests = await this.find();
        res.status(200).json(interests);
    }
    catch(err){
        res.status(500).json({error: 'Error processing database'});
    }
}

const Interest = mongoose.model('Interest',InterestSchema);
module.exports =Interest;