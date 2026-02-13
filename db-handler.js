const mongoose = require('mongoose');

require('dotenv').config();

const dbName = process.env.DB_NAME;
const dbServer = process.env.DB_SERVER;
const connectionString = `${dbServer}/${dbName}`;

/**
 * Connects to the MongoDB database using Mongoose's default connection.
 * 
 * @param {number} [timeout=5000] - The server selection timeout in ms.
 * @returns {Promise<mongoose.Mongoose>} A promise that resolves to the default mongoose instance.
 */
async function connect(timeout = 5000) {
    return mongoose.connect(connectionString, {
        serverSelectionTimeoutMS: timeout
    });
}

/**
 * Closes the connection to the MongoDB database.
 * 
 * @returns {Promise<void>} A promise that resolves when the connection is closed.
 */
async function close() {
    return mongoose.connection.close();
}

module.exports = {
    connect,
    close
};
