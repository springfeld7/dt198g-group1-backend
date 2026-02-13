const mongoose = require('mongoose');
const {Schema} = require("mongoose");
const objectIdRef = { type: Schema.Types.ObjectId, ref: 'User' };
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
 * @property {mongoose.Types.ObjectId[]} registeredMen - The men users registered for the event.
 * @property {mongoose.Types.ObjectId[]} registerdWomen - The women users registered for the event.
 * @property {mongoose.Types.ObjectId[][]} pairsFirstRound - The matched pairs for the first round.
 * @property {mongoose.Types.ObjectId[][]} pairsSecondtRound - The matched pairs for the second round.
 * @property {mongoose.Types.ObjectId[][]} pairsThirdRound- The matched pairs for the third round.
 */
const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true},
    location: { type: String, required: true },
    maxSpots : {type: Number, required: true,min: 1},
    registeredMen: {type: [objectIdRef], default: []},
    registeredWomen : {type: [objectIdRef], default: []},
    pairsFirstRound: { type: [[objectIdRef]], default: []},
    pairsSecondRound: { type: [[objectIdRef]], default: []},
    pairsThirdRound: { type: [[objectIdRef]], default: []},
})

const Event = mongoose.model('Event', EventSchema);
module.exports =Event;