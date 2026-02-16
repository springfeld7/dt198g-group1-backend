/**
 * A middleware that checks if the user is Admin
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const adminAuthenticate = (req, res, next) => {
    if ((!req.session?.user?.isAdmin)) {
        return res.status(403).json({error: "Admin access required"});
    }
    next();
};

module.exports = adminAuthenticate;
