require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());  // Replaces body-parser

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/order_steps_db";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err)); 

// Schema & Model
const ConceptSchema = new mongoose.Schema({
    name: String, 
    steps: [String]
});
const Concept = mongoose.model("Concept", ConceptSchema);

// Routes
app.post("/save-concepts", async (req, res) => {
    try {
        const { concepts } = req.body;
        await Concept.insertMany(concepts);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/get-concepts", async (req, res) => {
    try {
        const concepts = await Concept.find();
        res.json(concepts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5100;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
