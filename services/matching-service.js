/**
 * @fileoverview
 * Matching service for speed-dating events.
 *
 * This module provides functionality to generate optimal matches between
 * registered men and women for each round of an event. It calculates weighted
 * compatibility scores based on:
 *   - Shared interests
 *   - Past date feedback (happiness)
 *   - Age preferences
 *   - Forbidden pairs (previously matched)
 *
 * In addition to generating matches, this service produces **snapshots** of the
 * score matrix at each computation step to support frontend visualization:
 *   - Base snapshot of the initial interest similarity matrix
 *   - Update snapshots for each cell when computing weighted scores (happiness, age, and broaden adjustments)
 *   - Snapshots include a detailed breakdown of contributions, enabling hover tooltips
 *     showing interest similarity, happiness adjustment, age preference adjustment, and final score
 *
 * Core functionalities include:
 *   - Preloading historical data (previous rounds and reviews)
 *   - Building interest and weighted score matrices
 *   - Creating snapshots for visualization (base and update)
 *   - Running the Hungarian algorithm for maximum weight bipartite matching
 *   - Returning both the matched pairs and the stepwise snapshots for a given round
 */

const Event = require('../models/event');
const User = require('../models/user');
const Match = require('../models/match');
const Review = require('../models/review');
const Question = require('../models/question');
const { WEIGHTS, DEFAULTS, SIMILAR_AGE_TOLERANCE, MAX_INTERESTS, PERSPECTIVE_SCORE } = require('./matching-config');

/**
 * Hungarian Algorithm (a.k.a. Kuhn-Munkres Algorithm) for Maximum Weight Bipartite Matching.
 *
 * This algorithm finds the optimal assignment of `n` men to `n` women (or two equal-sized sets) 
 * such that the sum of assigned weights is maximized.
 *
 * Time Complexity: O(n^3)
 * Space Complexity: O(n^2)
 *
 * @param {number[][]} matrix - A square NxN matrix representing weights (scores) of matching.
 *                              matrix[i][j] is the score of assigning row i (man) to column j (woman).
 *                              Higher values indicate better matches.
 *
 * @returns {number[]} assignment - An array of length N where index `i` represents the row (man),
 *                                  and value `assignment[i]` is the column (woman) assigned to him.
 *                                  Example: assignment[0] = 2 means man 0 is matched with woman 2.
 *
 * Notes:
 * - The algorithm works with positive or negative weights.
 * - It guarantees a globally optimal assignment (max sum of weights).
 * - Used in the matching service to pair participants in a speed-dating event.
 *
 * Example:
 * const scores = [
 *   [0.8, 0.5, 0.3],
 *   [0.4, 0.9, 0.2],
 *   [0.6, 0.7, 0.5]
 * ];
 * const result = hungarian(scores);
 * console.log(result); // Might output: [0,1,2] meaning man0->woman0, man1->woman1, man2->woman2
 */
function hungarian(matrix) {
    const n = matrix.length;

    // Dual variables for rows (u) and columns (v)
    const u = new Array(n + 1).fill(0);
    const v = new Array(n + 1).fill(0);

    // p[j] = row assigned to column j
    const p = new Array(n + 1).fill(0);

    // way[j] = previous column for augmenting path
    const way = new Array(n + 1).fill(0);

    for (let i = 1; i <= n; i++) {
        // Start with row i
        p[0] = i;
        let j0 = 0;

        // Minimum values for each column not yet used in augmenting path
        const minv = new Array(n + 1).fill(Infinity);

        // Columns already included in the alternating tree
        const used = new Array(n + 1).fill(false);

        do {
            used[j0] = true;
            const i0 = p[j0]; // row currently matched to j0
            let delta = Infinity; // minimum slack in this iteration
            let j1 = 0; // column to extend tree

            // Iterate over all columns to find minimal slack
            for (let j = 1; j <= n; j++) {
                if (!used[j]) {
                    // Current reduced cost
                    const cur = -(matrix[i0 - 1][j - 1]) - u[i0] - v[j];

                    if (cur < minv[j]) {
                        minv[j] = cur;
                        way[j] = j0; // store previous column in path
                    }

                    if (minv[j] < delta) {
                        delta = minv[j];
                        j1 = j; // update column with minimal slack
                    }
                }
            }

            // Update dual variables
            for (let j = 0; j <= n; j++) {
                if (used[j]) {
                    u[p[j]] += delta;
                    v[j] -= delta;
                } else {
                    minv[j] -= delta;
                }
            }

            j0 = j1; // move to next column
        } while (p[j0] !== 0); // continue until we reach an unmatched column

        // Augment along the path found
        do {
            const j1 = way[j0];
            p[j0] = p[j1];
            j0 = j1;
        } while (j0);
    }

    // Build assignment array: assignment[i] = column assigned to row i
    const assignment = new Array(n);
    for (let j = 1; j <= n; j++) {
        if (p[j] > 0) assignment[p[j] - 1] = j - 1;
    }

    return assignment;
}

/**
 * Generate matches for a round [1,2,3] of an event.
 * 
 * @param {string} eventId - The ID of the event for which to generate matches.
 * @param {number} round - The round number (1, 2, or 3) for which to generate matches.
 * @returns {Promise<Array<{man: ObjectId, woman: ObjectId}>>} A promise that resolves to an array of match objects.
 */
async function generateMatches(eventId, round) {
    const event = await Event.findById(eventId)
        .populate({ path: 'registeredMen', select: '_id age interests' })
        .populate({ path: 'registeredWomen', select: '_id age interests' });

    if (!event) throw new Error("Event not found");

    const men = event.registeredMen;
    const women = event.registeredWomen;
    const n = men.length;
    if (men.length !== women.length) throw new Error("Unequal men/women count");

    // Precompute interest sets
    const manInterestSets = men.map(m => new Set(m.interests.map(i => i.toString())));
    const womanInterestSets = women.map(w => new Set(w.interests.map(i => i.toString())));

    // Compute base interest matrix
    const interestMatrix = buildInterestMatrix(n, manInterestSets, womanInterestSets);

    // Preload previous rounds + reviews
    const { forbiddenPairs, reviewByUser, lastDateByUser } = await preloadPreviousData(event, round);

    // Build weighted score matrix
    const questions = await Question.getQuestions();
    const { matrix: scoreMatrix, snapshots } = buildScoreMatrix({
        n,
        men,
        women,
        interestMatrix,
        forbiddenPairs,
        reviewByUser,
        lastDateByUser,
        questions,
        round
    });

    // Run Hungarian algorithm
    const assignment = hungarian(scoreMatrix);

    // Map results to man/woman pairs
    const matchedPairs = assignment.map((womanIndex, manIndex) => ({
        man: men[manIndex]._id,
        woman: women[womanIndex]._id
    }));

    printScoreMatrix(men, women, scoreMatrix);

    return { matchedPairs, snapshots };
}

/* ---------------- PRIVATE HELPERS ---------------- */

/**
 * Build a base interest similarity matrix between men and women.
 *
 * @param {number} n - Number of participants (men/women count, must be equal)
 * @param {Set<string>[]} manInterestSets - Array of Sets, each containing a man's interest IDs as strings
 * @param {Set<string>[]} womanInterestSets - Array of Sets, each containing a woman's interest IDs as strings
 * @returns {number[][]} A 2D array (n x n) where each element is the normalized count of common interests (0-1)
 */
function buildInterestMatrix(n, manInterestSets, womanInterestSets) {
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            let common = 0;
            for (const interest of manInterestSets[i])
                if (womanInterestSets[j].has(interest)) common++;
            matrix[i][j] = common / 5; // normalize to 0-1
        }
    }
    return matrix;
}

/**
 * Preload previous round data to assist in scoring.
 *
 * Loads:
 * - Forbidden pairs (users who have already been matched in previous rounds)
 * - Reviews from the last completed round
 * - Last date's user objects for each reviewer
 *
 * @param {import('../models/event')} event - Event document
 * @param {number} round - Current round number (1,2,3)
 * @returns {Promise<{forbiddenPairs: Set<string>, reviewByUser: Map<string, import('../models/review')>, lastDateByUser: Map<string, import('../models/user')>}>}
 *   forbiddenPairs - Set of strings in the format "manId_womanId" representing pairs that cannot be repeated
 *   reviewByUser - Map of reviewerId -> Review document from previous round
 *   lastDateByUser - Map of reviewerId -> User object of the person they last dated
 */
async function preloadPreviousData(event, round) {
    const forbiddenPairs = new Set();
    const reviewByUser = new Map();
    const lastDateByUser = new Map();

    if (round === 1) return { forbiddenPairs, reviewByUser, lastDateByUser };

    const previousRoundsKeys = ['pairsFirstRound'];
    if (round > 2) previousRoundsKeys.push('pairsSecondRound');

    // Load all previous matches
    for (const key of previousRoundsKeys) {
        const prevMatches = await Match.find({ _id: { $in: event[key] } }).select('man woman');
        for (const m of prevMatches) forbiddenPairs.add(`${m.man.toString()}_${m.woman.toString()}`);
    }

    // Load reviews for the last round only
    const reviews = await Review.find({ eventId: event._id, round: round - 1 });
    for (const r of reviews) reviewByUser.set(r.reviewer.toString(), r);

    // Map reviewer -> last date User object
    const lastDateIds = reviews.map(r => r.dateId);
    const lastDates = await User.find({ _id: { $in: lastDateIds } }).select('_id age interests');
    const lastDateMap = new Map(lastDates.map(u => [u._id.toString(), u]));

    for (const r of reviews) {
        const lastDate = lastDateMap.get(r.dateId.toString());
        if (lastDate) lastDateByUser.set(r.reviewer.toString(), lastDate);
    }

    return { forbiddenPairs, reviewByUser, lastDateByUser };
}

/**
 * @typedef {Object} ScoreMatrixContext
 * @property {number} n - Number of participants
 * @property {Array<User>} men - Array of men
 * @property {Array<User>} women - Array of women
 * @property {Array<Array<number>>} interestMatrix - Precomputed interest similarity matrix
 * @property {Set<string>} forbiddenPairs - Set of "manId_womanId" strings to skip
 * @property {Map<string, Review>} reviewByUser - Map of reviewerId -> Review
 * @property {Map<string, User>} lastDateByUser - Map of reviewerId -> last date User
 * @property {Array<Question>} questions - List of questions
 * @property {number} round - The current round number
 */

/**
 * Build a weighted score matrix for men-women pairings.
 *
 * The score includes:
 * - Base interest similarity
 * - Forbidden pairs (-1000)
 * - Adjustments from previous round reviews (happiness, broaden preference, age preference)
 *
 * @param {ScoreMatrixContext} ctx - Context object containing all required data
 * @returns {Array<Array<number>>} Weighted score matrix
 */
function buildScoreMatrix(ctx) {
    const { n, men, women, interestMatrix, forbiddenPairs, reviewByUser, lastDateByUser, questions, round } = ctx;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    const snapshots = [];
    let step = 0;

    snapshots.push(createBaseSnapshot(interestMatrix, men.map(m => m._id), women.map(w => w._id)));

    if (round === 1) {
        return { matrix: interestMatrix, snapshots };
    }

    // Get question IDs
    const WAS_HAPPY_QID = questions.find(q => q.text.includes("happy"))?._id.toString();
    const BROADEN_QID = questions.find(q => q.text.includes("broaden"))?._id.toString();
    const AGE_PREF_QID = questions.find(q => q.text.includes("younger or older"))?._id.toString();

    // PRECOMPUTE for Men and Women
    const prepData = (users) => users.map(u => {
        const id = u._id.toString();
        const review = reviewByUser.get(id);
        const lastDate = lastDateByUser.get(id);
        return {
            id,
            age: u.age,
            interests: new Set(u.interests.map(i => i.toString())),
            lastDateAge: lastDate?.age,
            lastDateInterests: lastDate ? new Set(lastDate.interests.map(i => i.toString())) : null,
            wasHappy: review?.answers.get(WAS_HAPPY_QID) ?? DEFAULTS.wasHappy,
            broaden: review?.answers.get(BROADEN_QID) ?? DEFAULTS.broaden,
            agePref: review?.answers.get(AGE_PREF_QID) ?? DEFAULTS.agePref,
            hasReviewData: !!(review && lastDate)
        };
    });

    const menData = prepData(men);
    const womenData = prepData(women);

    for (let i = 0; i < n; i++) {
        const m = menData[i];

        for (let j = 0; j < n; j++) {
            const w = womenData[j];

            if (forbiddenPairs.has(`${m.id}_${w.id}`)) {
                matrix[i][j] = WEIGHTS.forbiddenPair;
                snapshots.push(
                    createUpdateSnapshot(++step, i, j, WEIGHTS.forbiddenPair, {
                        interest: 0,
                        happy: 0,
                        age: 0,
                        reason: "forbidden pair"
                    })
                );
                continue;
            }

            const manHappyScore = calcHappyScore(m, w);
            const manAgeScore = calcAgeScore(m, w);
            const womanHappyScore = calcHappyScore(w, m);
            const womanAgeScore = calcAgeScore(w, m);

            const combinedHappy = (manHappyScore + womanHappyScore) / 2;
            const combinedAge = (manAgeScore + womanAgeScore) / 2;
            const wInt = m.broaden ? WEIGHTS.interest : 1.0;

            const interestContribution = wInt * interestMatrix[i][j];
            const happyContribution = WEIGHTS.happy * combinedHappy;
            const ageContribution = WEIGHTS.age * combinedAge;

            const score = interestContribution + happyContribution + ageContribution;

            matrix[i][j] = score;
            snapshots.push(
                createUpdateSnapshot(++step, i, j, score, {
                    interest: interestContribution,
                    happy: happyContribution,
                    age: ageContribution,
                })
            );
        }
    }
    return matrix;
}

/**
 * Calculate a user's happiness score for a potential match.
 * If the user has no review data, returns a default score.
 * @param {Object} user - The user for whom we are calculating the score (must include wasHappy, lastDateInterests, hasReviewData).
 * @param {Object} candidate - The potential match (must include interests).
 * @returns {number} A score between 0 and 1 representing happiness similarity.
 */
function calcHappyScore(user, candidate) {
    if (!user.hasReviewData) return PERSPECTIVE_SCORE;
    let sim = 0;
    for (const item of candidate.interests) {
        if (user.lastDateInterests.has(item)) sim++;
    }
    return user.wasHappy ? sim / MAX_INTERESTS : 1 - (sim / MAX_INTERESTS);
}

/**
 * Calculate a user's age preference score for a potential match.
 * If the user has no review data, returns a default score.
 * @param {Object} user - The user for whom we are calculating the score (must include agePref, lastDateAge, age, hasReviewData).
 * @param {Object} candidate - The potential match (must include age).
 * @returns {number} A score between 0 and 1 representing age preference match.
 */
function calcAgeScore(user, candidate) {
    if (!user.hasReviewData) {
        return PERSPECTIVE_SCORE;
    }
    switch (user.agePref) {
        case 0: // prefers younger than last date
            return candidate.age < user.lastDateAge ? 1 : 0;
        case 1: // prefers older than last date
            return candidate.age > user.lastDateAge ? 1 : 0;
        case 2: // prefers similar age
            return Math.abs(candidate.age - user.age) <= SIMILAR_AGE_TOLERANCE ? 1 : 0;
        default:
            return PERSPECTIVE_SCORE;
    }
}

/**
 * Create a base snapshot for visualization.
 *
 * @param {number[][]} matrix - The NxN matrix representing the initial scores.
 * @param {string[]} rowIds - Array of participant IDs corresponding to each row (e.g., men).
 * @param {string[]} colIds - Array of participant IDs corresponding to each column (e.g., women).
 * @returns {{type: "base", step: number, rowIds: string[], colIds: string[], matrix: number[][]}} 
 *   Base snapshot object
 *   - type: Always "base"
 *   - step: Step number (0 for base snapshot)
 *   - rowIds: Participant IDs for rows
 *   - colIds: Participant IDs for columns
 *   - matrix: The original NxN score matrix
 */
function createBaseSnapshot(matrix, rowIds, colIds) {
    return { type: "base", step: 0, rowIds, colIds, matrix };
}

/**
 * Create an update snapshot for a single cell in the score matrix.
 *
 * Update snapshots are used to show step-by-step changes in the
 * matrix for visualization and include a breakdown of the scoring components.
 *
 * @param {number} step - The sequential step number of this update.
 * @param {number} row - Row index (participant index for the row, e.g., man).
 * @param {number} col - Column index (participant index for the column, e.g., woman).
 * @param {number} value - Final calculated value for this cell.
 * @param {{interest: number, happy: number, age: number}} breakdown - Weighted contributions for this cell.
 * @returns {{type: "update", step: number, row: number, col: number, value: number, 
 *              breakdown: {interest: number, happy: number, age: number}}} Update snapshot object
 */
function createUpdateSnapshot(step, row, col, value, breakdown) {
    return { type: "update", step, row, col, value, breakdown };
}

/**
 * Prints the weighted score matrix for matching.
 *
 * @param {Array<Object>} men - Male participants.
 * @param {Array<Object>} women - Female participants.
 * @param {number[][]} scoreMatrix - Weighted compatibility scores.
 */
function printScoreMatrix(men, women, scoreMatrix) {
    const n = men.length;

    console.log("\nWeighted Score Matrix (rows=men, cols=women):");
    console.log(
        "          | " +
        women.map(w => w._id.toString().padEnd(10)).join(" | ")
    );

    for (let i = 0; i < n; i++) {
        const row = scoreMatrix[i]
            .map(score => score.toFixed(2).padEnd(10))
            .join(" | ");

        console.log(
            men[i]._id.toString().padEnd(10) + " | " + row
        );
    }
    console.log();
}

module.exports = { generateMatches };
