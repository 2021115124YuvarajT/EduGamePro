const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5004; 

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/learningAppDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schema Definition
const categorySchema = new mongoose.Schema({
  name: String,
  image: String,
  description: String,
});

const learningContentSchema = new mongoose.Schema({
  topic: String,
  categories: [categorySchema],
});

const LearningContent = mongoose.model("LearningContent", learningContentSchema);

// API Route to Save Categories
app.post("/save-categories", async (req, res) => {
  try {
    const { topic, categories } = req.body;

    // Create a new LearningContent document
    const newContent = new LearningContent({
      topic,
      categories,
    });
    await LearningContent.deleteMany({});
    // Save the document to MongoDB
    await newContent.save();

    res.status(201).json({ message: "Categories saved successfully!" });
  } catch (error) {
    console.error("Error saving categories:", error);
    res.status(500).json({ error: "Failed to save categories" });
  }
});

// API Route to Get Preview Data
app.get("/get-preview", async (req, res) => {
  try {
    const previewData = await LearningContent.findOne(); // Fetch the first content document from MongoDB
    if (!previewData) {
      return res.status(404).json({ error: "No preview data found" });
    }
    res.json(previewData);
  } catch (error) {
    console.error("Error fetching preview data:", error);
    res.status(500).json({ error: "Failed to fetch preview data" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
