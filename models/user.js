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
 * @property {mongoose.Types.ObjectId[]} matches - References to other User documents matched with this user.
 */
const userSchema = new mongoose.Schema({
    
    username: { 
        type: String,
        required: [true, 'Username is required!'],
        unique: true,
        lowercase: true,
        trim: true,
        min: [3, 'Username must be at least 3 character long'],
        max: [32, 'Username can be at most 32 characters long']
    },
    passwordHash: {
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
        min: [1, 'First name must be at least 1 character long'],
        max: [64, 'First name can be at most 64 characters long']
    },
    surname: { 
        type: String,
        trim: true,
        required: [true, 'Last name is required!'],
        min: [1, 'Last name must be at least 1 character long'],
        max: [64, 'Last name can be at most 64 characters long']
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
        min: [6, 'E-mail must be at least 6 character long'],
        max: [128, 'E-mail can be at most 128 characters long']
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

module.exports = mongoose.model('User', userSchema);
