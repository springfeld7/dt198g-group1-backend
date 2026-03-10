const mongoose = require('mongoose');
const {Schema} = require("mongoose");
/**
 * Match Schema for interacting with the match database.
 *
 * This schema defines the structure of matches in the database.
 *
 * @schema MatchShema
 * @property {ObjectId} man - The male participant
 * @property {ObjectId} women - The woman participant
 * @property {mongoose.Types.ObjectId[]} reviews - References to review documents
 * @property {Map<string, boolean>} likedBy - Map with userId as key and value if the user liked the other user
 */
const MatchSchema = new mongoose.Schema({
    man: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    woman: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    reviews: [{type: Schema.Types.ObjectId, ref: 'Review', default: []}],
    likedBy: {type: Map, of: Boolean, default: {}}
});

module.exports = mongoose.model('Match', MatchSchema);
