const mongoose = require('mongoose');

/**
 * Question Schema for interacting with the interest database.
 *
 * This schema defines the structure of questions in the database.
 *
 * @schema Question
 * @property {String} text - The string of the question
 * @property {String} type - The type of question (true/false,multichoice,text)
 * @property {String[]} [options] - Optional array of options for multichoice questions
 */
const QuestionSchema = new mongoose.Schema({
    text: {type: String, required: true},
    type: {type: String, required: true, enum: ['boolean', 'multipleChoice', 'text']},
    options: {type: [String], default: undefined}
});


const Question = mongoose.model('Question', QuestionSchema);
module.exports = Question;