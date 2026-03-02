const Event = require('../models/event');
const User = require('../models/user');
const Match = require('../models/match');
const Review = require('../models/review');

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
    const u = new Array(n + 1).fill(0);
    const v = new Array(n + 1).fill(0);
    const p = new Array(n + 1).fill(0);
    const way = new Array(n + 1).fill(0);

    for (let i = 1; i <= n; i++) {
        p[0] = i;
        let j0 = 0;
        const minv = new Array(n + 1).fill(Infinity);
        const used = new Array(n + 1).fill(false);

        do {
            used[j0] = true;
            const i0 = p[j0];
            let delta = Infinity;
            let j1 = 0;

            for (let j = 1; j <= n; j++) {
                if (!used[j]) {
                    const cur = -(matrix[i0 - 1][j - 1]) - u[i0] - v[j];
                    if (cur < minv[j]) {
                        minv[j] = cur;
                        way[j] = j0;
                    }
                    if (minv[j] < delta) {
                        delta = minv[j];
                        j1 = j;
                    }
                }
            }

            for (let j = 0; j <= n; j++) {
                if (used[j]) {
                    u[p[j]] += delta;
                    v[j] -= delta;
                } else {
                    minv[j] -= delta;
                }
            }

            j0 = j1;
        } while (p[j0] !== 0);

        do {
            const j1 = way[j0];
            p[j0] = p[j1];
            j0 = j1;
        } while (j0);
    }

    const assignment = new Array(n);
    for (let j = 1; j <= n; j++) {
        if (p[j] > 0) assignment[p[j] - 1] = j - 1;
    }

    return assignment;
}

/**
 * Generate matches for a round (1, 2, 3)
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
    const interestMatrix = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
            let common = 0;
            for (const interest of manInterestSets[i])
                if (womanInterestSets[j].has(interest)) common++;
            interestMatrix[i][j] = common / 5;
        }

    // Preload previous round data
    let forbiddenPairs = new Set();
    let reviewByMan = new Map();
    let lastDateByMan = new Map();
    if (round > 1) {
        const previousRoundKey = round === 2 ? 'pairsFirstRound' : 'pairsSecondRound';
        const previousMatches = await Match.find({ _id: { $in: event[previousRoundKey] } }).select('man woman');
        for (const m of previousMatches)
            forbiddenPairs.add(`${m.man.toString()}_${m.woman.toString()}`);

        const reviews = await Review.find({ eventId, round: round - 1 });
        for (const r of reviews) reviewByMan.set(r.reviewer.toString(), r);

        const lastDateIds = reviews.map(r => r.dateId);
        const lastDates = await User.find({ _id: { $in: lastDateIds } }).select('_id age interests');
        const lastDateMap = new Map();
        for (const u of lastDates) lastDateMap.set(u._id.toString(), u);
        for (const r of reviews) {
            const lastDate = lastDateMap.get(r.dateId.toString());
            if (lastDate) lastDateByMan.set(r.reviewer.toString(), lastDate);
        }
    }

    // Build weighted matrix
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        const man = men[i];
        const manId = man._id.toString();
        const review = reviewByMan.get(manId);
        const lastDate = lastDateByMan.get(manId);

        const wasHappy = review?.answers.get("happy") ?? true;
        const broaden = review?.answers.get("broaden") ?? true;
        const agePref = review?.answers.get("agePref") ?? 2;

        for (let j = 0; j < n; j++) {
            const woman = women[j];
            if (forbiddenPairs.has(`${manId}_${woman._id.toString()}`)) {
                matrix[i][j] = -1000;
                continue;
            }

            let score = interestMatrix[i][j];
            if (round > 1 && review && lastDate) {
                let wInterest = broaden ? 0.5 : 1.0;
                const wHappy = 0.5;
                const wAge = 0.5;

                // Happiness similarity
                let similarity = 0;
                const lastInterestSet = new Set(lastDate.interests.map(i => i.toString()));
                for (const interest of womanInterestSets[j])
                    if (lastInterestSet.has(interest)) similarity++;
                similarity /= 5;
                const happyScore = wasHappy ? similarity : 1 - similarity;

                // Age preference
                let ageScore = 0;
                if (agePref === 0 && woman.age < lastDate.age) ageScore = 0.3;
                else if (agePref === 1 && woman.age > lastDate.age) ageScore = 0.3;
                else if (agePref === 2 && Math.abs(woman.age - man.age) <= 3) ageScore = 0.3;

                score = wInterest * interestMatrix[i][j] + wHappy * happyScore + wAge * ageScore;
            }
            matrix[i][j] = score;
        }
    }

    // Run Hungarian algorithm
    const assignment = hungarian(matrix);

    // Bulk insert matches
    const matchDocs = assignment.map((womanIndex, manIndex) => ({
        man: men[manIndex]._id,
        woman: women[womanIndex]._id
    }));
    const createdMatches = await Match.insertMany(matchDocs);
    const matchIds = createdMatches.map(m => m._id);

    if (round === 1) event.pairsFirstRound = matchIds;
    else if (round === 2) event.pairsSecondRound = matchIds;
    else if (round === 3) event.pairsThirdRound = matchIds;

    await event.save();
    return matchIds;
}

module.exports = { generateMatches };
