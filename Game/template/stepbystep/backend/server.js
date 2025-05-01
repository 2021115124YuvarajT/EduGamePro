const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const xlsx = require('xlsx');
const cors = require('cors');  // Import CORS
const app = express();

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/steps', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Step Schema
const StepSchema = new mongoose.Schema({
  image: String,
  description: String,
});
const Step = mongoose.model('Step', StepSchema);

// Multer configuration for image and quiz file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// Route to upload a step (image and description)
app.post('/upload-step', upload.single('image'), async (req, res) => {
  try {
    const { description } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;
    const newStep = new Step({ image: imageUrl, description });
    await newStep.save();
    res.json({ message: 'Step uploaded successfully!', step: newStep });
  } catch (error) {
    console.error('Error uploading step:', error);
    res.status(500).json({ message: 'Error uploading step' });
  }
});

// Route to fetch all steps
app.get('/steps', async (req, res) => {
  try {
    // Fetch all steps from the database
    const steps = await Step.find(); 
    console.log(steps); 
    res.json(steps);  // Send the steps as a JSON response
  } catch (error) {
    console.error('Error fetching steps:', error);
    res.status(500).json({ message: 'Error fetching steps' });
  }
});

// Start server
app.listen(5002, () => {
  console.log('Server running on http://localhost:5002');
});
