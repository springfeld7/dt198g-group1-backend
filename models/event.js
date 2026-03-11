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
    pairsFirstRound: [ { type: Schema.Types.ObjectId, ref: 'Match' } ],
    pairsSecondRound: [ { type: Schema.Types.ObjectId, ref: 'Match' } ],
    pairsThirdRound: [ { type: Schema.Types.ObjectId, ref: 'Match' } ],
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
    const registered = await this.alreadyRegisterForEvent(event,userId,gender)

    if (registered.alreadyRegistered) {
        throw new Error("User already registered");
    }

    return this.findByIdAndUpdate(
        new mongoose.Types.ObjectId(event.id),
        {$addToSet: {[registered.field]: new mongoose.Types.ObjectId(userId)}},
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
    const registered = await this.alreadyRegisterForEvent(event,userId,gender)

    if (!registered.alreadyRegistered) {
        throw new Error("User already unregistered");
    }

    return this.findByIdAndUpdate(
        new mongoose.Types.ObjectId(event.id),
        {$pull: {[registered.field]: new mongoose.Types.ObjectId(userId)}},
        {returnDocument: "after"}
    );
}

/**
 * Updates an existing event in the database.
 *
 * @param {EventDocument} event - The Mongoose event document that must already exist.
 * @param {Object} updateFields - Fields to update.
 * @param {string} [updateFields.title] - New title.
 * @param {string} [updateFields.description] - New description.
 * @param {Date} [updateFields.date] - New date.
 * @param {string} [updateFields.location] - New location.
 * @param {number} [updateFields.maxSpots] - New maxSpots.
 *
 * @returns {Promise<EventDocument>} Resolves to the updated event document.
 */
EventSchema.statics.updateEvent = async function(event,updateFields) {
    return this.findByIdAndUpdate(
        event.id,
        { $set: updateFields },
        { new: true, runValidators: true }
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

/**
 * Saves matches for a specific round.
 * @param {string} eventId
 * @param {number} round
 * @param {Array<Object>} matches
 * @returns {Promise<EventDocument>}
 */
EventSchema.statics.saveRoundMatches = async function(eventId, round, matches) {

    const Match = mongoose.model("Match");

    const createdMatches = await Match.insertMany(matches);

    const field =
        round === 1 ? "pairsFirstRound" :
        round === 2 ? "pairsSecondRound" :
        round === 3 ? "pairsThirdRound" : null;

    if (!field) throw new Error("Invalid round");

    return this.findByIdAndUpdate(
        eventId,
        { $set: { [field]: createdMatches.map(m => m._id) } },
        { returnDocument: 'after' }
    );
};

/**
 * Saves matches for a specific round.
 * @param {string} eventId
 * @param {number} round
 * @param {Array<Object>} matches
 * @returns {Promise<EventDocument>}
 */
EventSchema.statics.saveRoundMatches = async function(eventId, round, matches) {

    const Match = mongoose.model("Match");

    const createdMatches = await Match.insertMany(matches);

    const field =
        round === 1 ? "pairsFirstRound" :
        round === 2 ? "pairsSecondRound" :
        round === 3 ? "pairsThirdRound" : null;

    if (!field) throw new Error("Invalid round");

    return this.findByIdAndUpdate(
        eventId,
        { $set: { [field]: createdMatches.map(m => m._id) } },
        { returnDocument: 'after' }
    );
};

/**
 * Collects the users matches at the end of the event.
 * @param {EventDocument} event - The Mongoose event document
 * @param {string} userId - The ID of the user
 * @param {string} gender - The gender of the user ('male' or 'female')
 * @returns {Promise<Array<{
 *   matchId: import('mongoose').Types.ObjectId,
 *   otherUser: {
 *     _id: import('mongoose').Types.ObjectId,
 *     firstName: string,
 *     surname: string,
 *     username: string,
 *     gender: string
 *   },
 *   likedBy: Array<import('mongoose').Types.ObjectId>
 * }>>} Resolves to an array of match objects containing the other participant and like information.
 */
EventSchema.statics.getMatchesAtEnd = async function(event,userId,gender) {
    const allRounds = [
        ...event.pairsFirstRound,
        ...event.pairsSecondRound,
        ...event.pairsThirdRound
    ];

    const Match = mongoose.model('Match');

    const matches = await Match.find({ _id: { $in: allRounds } })
        .populate('man', '_id firstName surname')
        .populate('woman', '_id firstName surname')
        .exec();

    const userMatches = matches.filter(match =>
        match.man._id.toString() === userId.toString() ||
        match.woman._id.toString() === userId.toString())

    return userMatches.map(match => {
        const other = (gender === 'man') ? match.woman : match.man;
        return {
            matchId: match._id,
            otherUser: {
                _id: other._id,
                firstName: other.firstName,
                surname: other.surname,
                username: other.username,
                gender: other.gender
            },
            likedBy: match.likedBy
        };
    });
}

module.exports = mongoose.model('Event', EventSchema);
