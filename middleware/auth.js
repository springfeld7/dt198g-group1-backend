/**
 * A middleware that checks if the userId value is set in the session object.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const authenticate = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ status: 'You are not authorized to access this resource.' });
    }
};

module.exports = authenticate;
