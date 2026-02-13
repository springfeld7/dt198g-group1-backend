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
 * @property {type: Schema.Types.ObjectId} dateId -
 * @property {Map} answers - Map containing <questionID,question>
 */
const ReviewSchema = new mongoose.Schema({
    reviewer: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    eventId: {type: Schema.Types.ObjectId, ref: 'Event', required: true},
    round: {type: Number, required: true,min: 1},
    dateId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    answers: {type:Map, of:Schema.Types.Mixed,default:{},required:true},  //May be wrong check later
})

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;