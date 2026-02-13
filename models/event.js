const mongoose = require('mongoose');


/**
 * Event Schema for interacting with the event database.
 *
 * This schema defines the structure of events in the database.
 *
 * @schema Event
 * @property {String} title - The name of the event.
 * @property {String} description - The description of the event.
 * @property {Date} date - The date of the event.
 * @property {String} location - The location of the event.
 * @property {Number} maxSpots - the maximum number of spots.
 * @property {Number[]} registeredMen - The men users registered for the event.
 * @property {Number[]} registeredWomen - The women users registered for the event.
 * @property {mongoose.Types.ObjectId[][]} pairsFirstRound - The matched pairs for the first round.
 * @property {mongoose.Types.ObjectId[][]} pairsSecondtRound - The matched pairs for the second round.
 * @property {mongoose.Types.ObjectId[][]} pairsThirdRound- The matched pairs for the third round.
 */
const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    maxSpots : {type: Number, required: true },
    registeredMen : {type: [Number], required: true },
    registeredWomen : {type: [Number], required: true },
    pairsFirstRound: { type: [[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]], required: true },
    pairsSecondRound: { type: [[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]], required: true },
    pairsThirdRound: { type: [[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]], required: true },
})

const Event = mongoose.model('Event', EventSchema);
module.exports =Event;