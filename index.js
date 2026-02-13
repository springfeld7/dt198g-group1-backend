const express = require("express");
const cors = require("cors");
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const dotenv = require("dotenv");
const { BASE_URL } = require("./config");
const db = require('./db-handler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DB_SERVER,
        ttl: 24 * 60 * 60
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'lax',
    }
}))

const routes = require("./routes/routes");
app.use(BASE_URL, routes);

// Connect to the MongoDB database before starting the server.
db.connect()
  .then(() => {
    console.log('Connected to the MongoDB database.');
  })
  .catch(err => {
    console.error('Error with the initial connection to the MongoDB database: ' + err.message);
  });

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
