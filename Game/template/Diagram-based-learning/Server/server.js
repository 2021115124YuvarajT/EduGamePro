const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/elementsDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ElementSchema = new mongoose.Schema({
  title: String,
  description: String,
  diagramPath: String,
  gifPath: String,
  audioPath: String,
});

const Element = mongoose.model('Element', ElementSchema);

app.post('/api/save-elements', upload.fields([{ name: 'diagram' }, { name: 'gif' }, { name: 'audio' }]), async (req, res) => {
  try {
    console.log('Received Data:', req.body);  // Debugging step

    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required!' });
    }

    const diagramPath = req.files['diagram'] ? `/uploads/${req.files['diagram'][0].filename}` : null;
    const gifPath = req.files['gif'] ? `/uploads/${req.files['gif'][0].filename}` : null;
    const audioPath = req.files['audio'] ? `/uploads/${req.files['audio'][0].filename}` : null;

    const newElement = new Element({ title, description, diagramPath, gifPath, audioPath });
    const savedElement = await newElement.save();

    // Log saved data for debugging
    console.log('Saved Data:', savedElement);

    const baseUrl = 'http://localhost:5001'; // Change if hosted elsewhere

  res.json({
    title: savedElement.title,
    description: savedElement.description,
    diagramUrl: savedElement.diagramPath ? `${baseUrl}${savedElement.diagramPath}` : null,
    gifUrl: savedElement.gifPath ? `${baseUrl}${savedElement.gifPath}` : null,
    audioUrl: savedElement.audioPath ? `${baseUrl}${savedElement.audioPath}` : null
  });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({ message: 'Error saving data' });
  }
}); 

// DELETE endpoint to remove an element by its MongoDB _id
app.delete('/api/elements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the element by id
    const element = await Element.findById(id);
    if (!element) {
      return res.status(404).json({ message: 'Element not found' });
    }
    
    // Optional: Delete associated files from the uploads folder
    if (element.diagramPath) {
      const fullDiagramPath = path.join(__dirname, element.diagramPath);
      if (fs.existsSync(fullDiagramPath)) {
        fs.unlinkSync(fullDiagramPath);
      }
    }
    if (element.gifPath) {
      const fullGifPath = path.join(__dirname, element.gifPath);
      if (fs.existsSync(fullGifPath)) {
        fs.unlinkSync(fullGifPath);
      }
    }
    if (element.audioPath) {
      const fullAudioPath = path.join(__dirname, element.audioPath);
      if (fs.existsSync(fullAudioPath)) {
        fs.unlinkSync(fullAudioPath);
      }
    }
    
    // Remove the element document from MongoDB
    await element.remove();
    
    res.status(200).json({ message: 'Element deleted successfully' });
  } catch (error) {
    console.error('Error deleting element:', error);
    res.status(500).json({ message: 'Error deleting element' });
  }
});

app.listen(5001, () => {
  console.log('Server running on port 5001');
});
