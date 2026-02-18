/**
 * A middleware that logs the HTTP method and URL of an incoming
 * request to the console.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const requestLogger = (req, res, next) => {
	const now = new Date().toLocaleString();
	console.log(`[${now}] Received a ${req.method} request to ${req.originalUrl}`);

	next();
};

module.exports = requestLogger;