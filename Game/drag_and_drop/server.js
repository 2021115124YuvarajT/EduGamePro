const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5105;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/dragDropGame', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Define Schema
const itemSchema = new mongoose.Schema({
    taskId: Number,
    categoryId: Number,
    categoryName: String,
    itemName: String,
    imageUrl: String
});
const Item = mongoose.model('Item', itemSchema);

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// API Route to Upload Single Item with File
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { taskId, categoryId, categoryName, itemName } = req.body;
        console.log('Received data:', req.body); // Debugging
        
        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }

        const newItem = new Item({
            taskId: Number(taskId),
            categoryId: Number(categoryId),
            categoryName,
            itemName,
            imageUrl: `/uploads/${req.file.filename}`
        });
        await newItem.save();
        res.json({ message: 'Item uploaded successfully', item: newItem });
    } catch (error) {
        console.error('Error uploading item:', error);
        res.status(500).json({ message: 'Error uploading item', error });
    }
});

// Assuming MongoDB with Mongoose
app.delete('/clear-items', async (req, res) => {
    console.log("DELETE /clear-items called"); // Add this line
    try {
        const result = await Item.deleteMany({});
        console.log("Deleted count:", result.deletedCount);
        res.status(200).send('Items cleared.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error clearing items.');
    }
});

// Endpoint to Handle Bulk Item Upload
app.post('/uploadItems', async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Invalid items data' });
        }

        // Ensure all items contain `categoryName`
        const savedItems = await Item.insertMany(items);
        res.json({ message: 'Items uploaded successfully', savedItems });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading items', error });
    }
});


// Fetch All Items
app.get('/items/:taskId', async (req, res) => {
    try {
        const taskId = parseInt(req.params.taskId);
        const items = await Item.find({ taskId: taskId });
        res.json(items);
    } catch (error) {
        console.error('Error fetching items by taskId:', error);
        res.status(500).json({ message: 'Error fetching items', error });
    }
});


// Serve Game Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
