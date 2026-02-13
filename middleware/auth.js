/**
 * A middleware that checks if userId is set in the session object.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const authenticate = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = req.session.user;
    next();
};

module.exports = authenticate;
