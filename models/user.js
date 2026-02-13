const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // TODO: Implement user schema
})

/**
 * Creates a new user if the username is available.
 *
 * @param {object} data - User registration data.
 * @param {string} data.username - Unique username.
 * @param {string} data.passwordHash - Hashed password.
 * @param {string} data.firstName - First name.
 * @param {string} data.surname - Last name.
 * @param {string} data.email - Email address.
 * @param {string} data.phone - Phone number.
 * @param {number} data.age - User age.
 * @param {string} data.location - User location.
 * @param {string} data.gender - User gender.
 * @param {string[]} data.interests - Interest identifiers.
 * @returns {Promise<mongoose.Document>} Persisted user document.
 */
UserSchema.statics.register = async function (data) {
    const {
        username,
        passwordHash,
        firstName,
        surname,
        email,
        phone,
        age,
        location,
        gender,
        interests
    } = data;

    const userExists = await this.findOne({ username });

    if (userExists) {
        throw new Error('Username already exists');
    }

    const user = new this({
        username,
        passwordHash,
        firstName,
        surname,
        email,
        phone,
        age,
        location,
        gender,
        interests,
        matches: []
    });

    return user.save();
};

const Interest = mongoose.model('Interest',InterestSchema);
module.exports =Interest;
