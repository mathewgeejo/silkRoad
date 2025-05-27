import { Client } from "pg";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const connectionString =
  "postgresql://studentData_owner:npg_MLdTR0HjfmB8@ep-rapid-wildflower-a19kw674.ap-southeast-1.aws.neon.tech/studentData?sslmode=require";
const client = new Client({
  connectionString: connectionString,
});
client
  .connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Connection error", err.stack));

app.get("/suggest", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const result = await client.query(
      "SELECT id, name, department FROM students WHERE name ILIKE $1 ORDER BY name LIMIT 8",
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching suggestions", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/student", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");
    const result = await client.query(
      'SELECT name, date_of_birth, "Instagram_id" FROM students WHERE id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching student by id", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
