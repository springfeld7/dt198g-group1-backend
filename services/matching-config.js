/**
 * This module defines the configuration for the matching algorithm used in the application.
 *
 * It includes weights for different factors that contribute to the match score, default values for review answers,
 * and limits on user interests. Adjusting these values will affect how the matching algorithm calculates scores
 * and determines matches between users.
 */

/**
 * Weights for the matching algorithm.
 * Adjust these to tune how different factors affect the score.
 */
const WEIGHTS = {
    interest: 0.5,   // weight multiplier when broaden = true
    happy: 0.7,      // weight for happiness similarity
    age: 0.5,        // weight for age preference
    forbiddenPair: -1000 // score for forbidden pairs
};

/**
 * Default values for review answers when no review exists.
 */
const DEFAULTS = {
    wasHappy: true,
    broaden: true,
    agePref: 2
};

/**
 * Age tolerance for considering two users as similar in age.
 */
const SIMILAR_AGE_TOLERANCE = 3; 

/**
 * Default perspective score for happy and age when no review data is available.
 */
const PERSPECTIVE_SCORE = 0.5;

/**
 * Maximum number of interests a user can have.
 */
const MAX_INTERESTS = 5;

module.exports = { WEIGHTS, DEFAULTS, SIMILAR_AGE_TOLERANCE, MAX_INTERESTS, PERSPECTIVE_SCORE };
