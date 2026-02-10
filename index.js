const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { BASE_URL } = require("./config");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const routes = require("./routes/routes");

app.use(BASE_URL, routes);

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
