const mongoose = require('mongoose');


/**
 * User Schema for interacting with the user database.
 *
 * This schema defines the structure of users in the database.
 *
 * @schema User
 * @property {String} username - The unique username of the user (lowercased and trimmed).
 * @property {String} passwordHash - The hashed password of the user.
 * @property {Boolean} isAdmin - Indicates whether the user has administrator privileges.
 * @property {String} firstName - The first name of the user.
 * @property {String} surname - The surname of the user.
 * @property {String} gender - The gender of the user ("man" or "woman").
 * @property {Number} age - The age of the user.
 * @property {String} email - The unique email address of the user.
 * @property {String} phone - The phone number of the user.
 * @property {String} location - The location of the user.
 * @property {mongoose.Types.ObjectId[]} interests - References to Interest documents associated with the user.
 * @property {Object[]} matches - Array of match objects containing metadata.
 * @property {mongoose.Types.ObjectId} matches.user - Reference to the matched User document.
 * @property {Boolean} matches.isSeen - Whether the user has viewed this specific match.
 * @property {Date} matches.matchedAt - The timestamp when the match was created.
 */
const UserSchema = new mongoose.Schema({

    username: {
        type: String,
        required: [true, 'Username is required!'],
        unique: true,
        lowercase: true,
        trim: true,
        minLength: [3, 'Username must be at least 3 character long'],
        maxLength: [32, 'Username can be at most 32 characters long']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be at least 8 character long']
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    firstName: {
        type: String,
        required: [true, 'First name is required!'],
        trim: true,
        minLength: [1, 'First name must be at least 1 character long'],
        maxLength: [64, 'First name can be at most 64 characters long']
    },
    surname: {
        type: String,
        trim: true,
        required: [true, 'Last name is required!'],
        minLength: [1, 'Last name must be at least 1 character long'],
        maxLength: [64, 'Last name can be at most 64 characters long']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: ['man', 'woman'],
            message: 'Gender must be either "man" or "woman"'
        }
    },
    age: {
        type: Number,
        min: [0, 'Age cannot be negative'],
        max: [150, 'Age must be realistic']
    },
    email: {
        type: String,
        required: [true, 'E-mail is required'],
        unique: true,
        trim: true,
        match: [/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z.-]{2,}$/, 'Please enter a valid email address'],
        minLength: [6, 'E-mail must be at least 6 character long'],
        maxLength: [128, 'E-mail can be at most 128 characters long']
    },
    phone: {
        type: String,
        trim: true,
        maxLength: [32, 'Phone number can be at most 32 characters long']
    },
    location: {
        type: String,
        trim: true,
        maxLength: [128, 'Location can be at most 128 characters long']
    },
    interests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interest'
    }],
    matches: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        isSeen: {
            type: Boolean,
            default: false
        },
        matchedAt: {
            type: Date,
            default: Date.now
        }
    }]
});

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
        password,
        firstName,
        surname,
        email,
        phone,
        age,
        location,
        gender,
        interests
    } = data;

    await this.infoExist(username, email)

    const user = new this({
        username,
        password,
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

/**
 * Returns users from the database
 * @returns Promise<Array<UserDocument>> A Promise that resolves to an array of Mongoose User documents.
 */
UserSchema.statics.getUsers = async function () {
    return this.find().select('-password');
};

/**
 * Updates a user with the given data.
 * @param {string} id The ID of the user to update.
 * @param {Object} data The fields to update.
 * @param {string} [hashedPassword] Optional hashed password to update.
 * @returns {Promise<mongoose.Document>} The updated user document.
 * @throws {Error} Throws if the user is not found or username/email already exists.
 */
UserSchema.statics.updateUser = async function (id, data, hashedPassword) {
    await this.infoExist(data.username, data.email, id)


    const updateFields = {
        ...data,
        ...(hashedPassword && {password: hashedPassword})
    };

    const updatedUser = await this.findByIdAndUpdate(
        id,
        {$set: updateFields},
        {new: true, runValidators: true}
    ).lean();

    if (!updatedUser) throw new Error("User not found");

    return updatedUser;
}

/**
 * Returns a user by ID
 * @param {string} id id for the user
 * @returns {Promise<mongoose.Document|null>} The user object or null
 */
UserSchema.statics.getUserById = async function (id) {
    return this.findById(id)
        .populate({
            path: "interests",
            select: "name"
        }).select("-password");
};

/**
 * Returns a user matches
 * @param {string} id - The id of the user
 * @returns {Promise<*[]>} The user matches
 */
UserSchema.statics.getMatches = async function (id) {
    const user = await this.findById(id)
        .populate({
            path: "matches.user",
            select: "firstName surname phone email"
        })
        .select("matches -_id")
        .lean();

    if (!user) return [];

    return user.matches.map(match => ({
        ...match.user,
        isSeen: match.isSeen,
        matchedAt: match.matchedAt,
        img: `/resources/img/users/${match.user._id}.jpg`
    }));
};


/**
 * Add liked flag to the user match and if mutual adds the match to the users.
 * @param {string} userId - The id of the user
 * @param {string} match - The match object
 * @param {boolean} liked - the boolean flag for the users like
 * @returns {Promise<*[]>} The updated match.
 */
UserSchema.statics.addMatch = async function (userId, match, liked) {

    if (
        match.man.toString() !== userId.toString() &&
        match.woman.toString() !== userId.toString()) {
        throw new Error("User is not part of this match");
    }

    match.likedBy.set(userId.toString(), liked);
    await match.save();

    const manLiked = match.likedBy.get(userId.toString()) === true;
    const womanLiked = match.likedBy.get(match.woman.toString()) === true;

    if (manLiked && womanLiked) {
        const [manUpdate, womanUpdate] = await Promise.all([
            this.updateOne(
                {_id: match.man, "matches.user": {$ne: match.woman}},
                {$push: {matches: {user: match.woman, isSeen: false}}}
            ),
            this.updateOne(
                {_id: match.woman, "matches.user": {$ne: match.man}},
                {$push: {matches: {user: match.man, isSeen: false}}}
            )
        ])
        if (manUpdate.modifiedCount === 0 && womanUpdate.modifiedCount === 0) {
            throw new Error("Match is already added");
        }
        return match;
    }
}
/**
 * Marks all matches of a specific user as seen.
 * @param {string} userId - The ID of the user whose matches are being viewed.
 */
UserSchema.statics.markMatchesAsSeen = async function (userId) {
    return this.updateOne(
        {_id: userId},
        {$set: {"matches.$[].isSeen": true}}
    );
};

/**
 * Removes a match from the user's matches array.
 * @param {string} userId - The ID of the user.
 * @param {string} matchId - The ID of the match to be removed.
 * @returns {Promise}
 */
UserSchema.statics.removeMatch = async function (userId, matchId) {
    return this.updateOne(
        {_id: userId},
        {$pull: {matches: {user: matchId}}}
    );
};

/**
 * Checks if a username or email already exists in the database.
 * @param {string} username The username to check.
 * @param {string} email The email to check.
 * @param {boolean} excludeId boolean to exclude id.
 * @returns {Promise<void>} Resolves if username/email are available.
 * @throws {Error} Throws if a user with the given username or email already exists.
 */
UserSchema.statics.infoExist = async function (username, email, excludeId = null) {
    const query = {
        $or: [{username: username}, {email: email}]
    };
    if (excludeId) query._id = {$ne: excludeId};

    const userExists = await this.findOne(query);
    if (userExists) throw new Error('Username or email already exists');
}

module.exports = mongoose.model('User', UserSchema);