const mongoose = require('mongoose');
const {Schema} = require("mongoose");
const Question = require("./question");

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
 * @property {Map} questions - Map containing <questionID,question>
 */
const ReviewSchema = new mongoose.Schema({
    reviewer: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    eventId: {type: Schema.Types.ObjectId, ref: 'Event', required: true},
    round: {type: Number, required: true,min: 1},
    dateId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    questions: [{
        question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        value: Schema.Types.Mixed
    }]

})


/**
 * Returns a review document
 * @returns {Promise<mongoose.Document|null>} The user object or null
 */
ReviewSchema.statics.getReview = async function(reviewerId, dateData) {
    const questionsFromDB = await Question.find().lean();

    const questions = questionsFromDB.map(q => ({
        question: q._id,
        value: null
    }));

    const review = await this.findOneAndUpdate(
        {
            reviewer: reviewerId,
            eventId: dateData.eventId,
            round: dateData.round,
            dateId: dateData.dateId
        },
        { questions },
        { upsert: true, new: true }
    );

    return this.populate(review, [
        { path: "reviewer", select: "username" },
        { path: "dateId", select: "username" },
        { path: "questions.question", select: "text type options" }
    ]);
};

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;