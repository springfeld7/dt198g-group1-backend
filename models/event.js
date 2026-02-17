const mongoose = require('mongoose');
const {Schema} = require("mongoose");
const objectIdRef = { type: Schema.Types.ObjectId, ref: 'User' };

/**
 * @typedef {mongoose.Document & {
 *   title: string,
 *   description: string,
 *   date: Date,
 *   location: string,
 *   maxSpots: number,
 *   registeredMen: mongoose.Types.ObjectId[],
 *   registeredWomen: mongoose.Types.ObjectId[],
 *   pairsFirstRound: mongoose.Types.ObjectId[][],
 *   pairsSecondRound: mongoose.Types.ObjectId[][],
 *   pairsThirdRound: mongoose.Types.ObjectId[][]
 * }} EventDocument
 */

/**
 * Event Schema for interacting with the event database.
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

/**
 * Returns all events from the database
 * @returns {Promise<Array<EventDocument>>} A Promise that resolves to an array of Mongoose Event documents.
 */
EventSchema.statics.getEvents = async function() {
    return this.find()
}

/**
 * Returns an event from the database
 * @param id the id of the event requested
 * @returns Promise<EventDocument> A Promise that resolves to a  Mongoose Event document.
 */
EventSchema.statics.getEventById = async function(id) {
    return this.findById(id)
}

/**
 * Creates a new event in the database
 * @param {string} title - Title of the event
 * @param {string} description - Description of the event
 * @param {Date} date - Date of the event
 * @param {string} location - Location of the event
 * @param {number} maxSpots - Maximum number of spots for the event
 * @returns {Promise<EventDocument>} A Promise that resolves to the newly created Mongoose Event document.
 */
EventSchema.statics.createEvent = async function(title,description, date, location, maxSpots) {
    return this.create({
        title,
        description,
        date,
        location,
        maxSpots,
        registeredMen: [],
        registeredWomen: [],
        pairsFirstRound: [],
        pairsSecondRound: [],
        pairsThirdRound: [],
    })
}

/**
 * Registers a user for an event
 * @param {EventDocument} event - The Mongoose event document
 * @param {string} userId - The ID of the user to register
 * @param {string} gender - The gender of the user ('male' or 'female')
 * @returns {Promise<EventDocument>} A Promise that resolves to the updated Mongoose event document
 * @throws {Error} Throws an error if the user is already registered.
 */
EventSchema.statics.registerForEvent = async function(event,userId,gender) {
    const test = await this.alreadyRegisterForEvent(event,userId,gender)

    if (test.alreadyRegistered) {
        throw new Error("User already registered");
    }

    return this.findByIdAndUpdate(
        new mongoose.Types.ObjectId(event.id),
        {$addToSet: {[test.field]: new mongoose.Types.ObjectId(userId)}},
        {returnDocument: "after"}
    );
}


/**
 * Unregisters a user from an event
 * @param {EventDocument} event - The Mongoose event document
 * @param {string} userId - The ID of the user to unregister
 * @param {string} gender - The gender of the user ('male' or 'female')
 * @returns {Promise<EventDocument>} A Promise that resolves to the updated Mongoose event document
 * @throws {Error} Throws an error if the user is not currently registered.
 */
EventSchema.statics.unRegisterForEvent = async function(event,userId,gender) {
    const test = await this.alreadyRegisterForEvent(event,userId,gender)

    if (!test.alreadyRegistered) {
        throw new Error("User already unregistered");
    }

    return this.findByIdAndUpdate(
        new mongoose.Types.ObjectId(event.id),
        {$pull: {[test.field]: new mongoose.Types.ObjectId(userId)}},
        {returnDocument: "after"}
    );
}

/**
 * Deletes an event
 * @param id the id of the event to be deleted
 * @returns {Promise<EventDocument>} A Promise that resolves to the deleted Mongoose event document
 */
EventSchema.statics.delete = async function(id) {
    return this.findByIdAndDelete(id);
}

/**
 * Checks if a user is already registered for an event
 * @param {EventDocument} event - The Mongoose event document
 * @param {string} userId - The ID of the user
 * @param {string} gender - The gender of the user ('male' or 'female')
 * @returns {Promise<Object>} A Promise that resolves to an object containing:
 *  - alreadyRegistered {boolean} Whether the user is already registered
 *  - field {string} The field that contains the user array ('registeredMen' or 'registeredWomen')
 */
EventSchema.statics.alreadyRegisterForEvent = async function(event,userId,gender) {
    const field =
        gender === "female" ? "registeredWomen" : "registeredMen";

    const alreadyRegistered = event[field].some(id => id.equals(userId));
    return { alreadyRegistered, field};
}

module.exports = mongoose.model('Event', EventSchema);
