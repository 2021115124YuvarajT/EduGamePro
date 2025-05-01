const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const PORT = 7000;
const CSV_FILE = "game_metrics.csv";
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/game_DB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Schema & Model
const storageSchema = new mongoose.Schema({
  cardDescriptions: Object,
  cardValues: Array,
  noOfCards: Number,
  previewData: Object,
  startLearning: Boolean,
  topic_title: String,
});

const StorageData = mongoose.model("StorageData", storageSchema);
if (!fs.existsSync(CSV_FILE)) {
  fs.writeFileSync(CSV_FILE, "Topic,Difficulty,PSI Score,STM Score,AVPI,AVP Score,PS Score\n");
}

// API to store localStorage data
app.post("/saveData", async (req, res) => {
  try {
    const newData = new StorageData(req.body);
    await newData.save();
    res.json({ success: true, message: "Data saved successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to fetch the latest saved game data
app.get("/getData", async (req, res) => {
  try {
    const latestData = await StorageData.findOne().sort({ _id: -1 }); // Get the most recent entry
    res.json(latestData);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/save_metrics", (req, res) => {
  const { entry } = req.body;

  if (!entry) {
      return res.status(400).json({ error: "No data received" });
  }
 
  // Append new row to CSV file
  fs.appendFile(CSV_FILE, entry, (err) => {
      if (err) {
          console.error("❌ Error writing to CSV:", err);
          return res.status(500).json({ error: "Failed to save metrics" });
      }
      console.log("✅ Metrics saved successfully!");
      res.json({ message: "Metrics saved successfully!" });
  });
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
