const mongoose = require('mongoose');
const {Schema} = require("mongoose");

/**
 * Review Schema for interacting with the event database.
 *
 * This schema defines the structure of a review in the database.
 *
 * @schema Review
 * @property {Schema.Types.ObjectId} reviewer - The id of the user doing the review.
 * @property {Schema.Types.ObjectId} eventId - The id of the event.
 * @property {Number} round - The current round of the event.
 * @property {type: Schema.Types.ObjectId} dateId - The id of the user receiving the review.
 * @property {Map} answers - Map containing questionID,answer
 */
const ReviewSchema = new mongoose.Schema({
    reviewer: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    eventId: {type: Schema.Types.ObjectId, ref: 'Event', required: true},
    round: {type: Number, required: true, min: 1},
    dateId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    answers: {type: Map, of: Schema.Types.Mixed, required: true, default: {}}
})

/**
 * This method creates a new review entry in the database.
 * 
 * @param {Schema.Types.ObjectId} reviewer - The ID of the reviewer.
 * @param {Schema.Types.ObjectId} eventId - The ID of the event associated with the review.
 * @param {number} round - The round of the event.
 * @param {Schema.Types.ObjectId} dateId - The ID of the user receiving the review.
 * @param {Map} answers - A map containing question IDs and corresponding answers.
 * @returns {Promise} Resolves to the created review document.
 */
ReviewSchema.statics.createReview = async function(reviewer, eventId, round, dateId, answers) {
    return this.create({
        reviewer,
        eventId,
        round,
        dateId,
        answers
    });
};


module.exports = mongoose.model("Review", ReviewSchema);