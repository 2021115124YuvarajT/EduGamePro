const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5300;

// Middleware
app.use(cors()); 
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/gameDB')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Student and Teacher Schemas
const studentSchema = new mongoose.Schema({
    rollNumber: { type: Number, unique: true },
    password: String,
    progress: { level: Number, score: Number }
});

const teacherSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    progress: { level: Number, score: Number }
});

const studentEvalSchema = new mongoose.Schema({
    roll_number: { type: Number, unique: true },
    total_questions: { type: Number, default: 0 },
    answered_correctly: { type: Number, default: 0 }
});

const flagVarSchema = new mongoose.Schema({
    roll_number:{type:Number,unique:true},
    badges:[String],
    completedSbsTopics:[Number],
    completedTopics:[Number],
    q1Flag:Number,
    q2Flag:Number,
    shownQ1:Number,
    shownQ2:Number,
    shownSbs:Number
});
const FlagVar = mongoose.model('FlagVar',flagVarSchema);
const Student = mongoose.model('Student', studentSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const StudentEval = mongoose.model('StudentEval', studentEvalSchema);

// Student Signup
app.post('/api/students/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newStudent = new Student({ rollNumber: parseInt(username), password: hashedPassword, progress: { level: 1, score: 0 } });
        await newStudent.save();
        res.status(201).send("Student registered successfully");
    } catch (error) {
        res.status(400).send("Roll number already exists");
    }
});

// Teacher Signup
app.post('/api/teachers/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newTeacher = new Teacher({ email: username, password: hashedPassword, progress: { level: 1, score: 0 } });
        await newTeacher.save();
        res.status(201).send("Teacher registered successfully");
    } catch (error) {
        res.status(400).send("Email already exists");
    }
});

// Student Login
app.post('/api/students/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Roll number and password are required." });
    }

    const rollNumber = parseInt(username);
    if (isNaN(rollNumber)) {
        return res.status(400).json({ message: "Roll number must be a valid number." });
    }

    try {
        const student = await Student.findOne({ rollNumber: rollNumber });
        if (student && await bcrypt.compare(password, student.password)) {
            const token = jwt.sign({ id: student._id }, 'your_jwt_secret');
            res.json({ token, progress: student.progress });
        } else {
            res.status(400).json({ message: "Invalid roll number or password." });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
//student flag var fetch
app.post('/api/students/fetchFlagVar', async (req, res) => {
    console.log("request received");
    const { roll_number } = req.body; // Destructure roll_number from req.body
    try {
        console.log("I am trying");
        const localLiterals = await FlagVar.findOne({ roll_number: roll_number }); // Ensure field name matches database
        if (localLiterals) {
            console.log('localLiterals:', localLiterals); // Debug: Print to confirm
            res.json({ data: localLiterals });
        } else {
            return res.status(404).json({ message: "Data not found." });
        }
    } catch (error) {
        console.error("Error fetching flag variables:", error); // Debug: Catch any errors
        res.status(500).json({ message: "Internal server error" });
    }
});

//student click logout, write back the data
app.post('/api/students/writeFlagVar', async (req, res) => {
    console.log("Logout write received");
    const { data } = req.body;

    try {
        console.log("Attempting to write to database");

        // Destructure data for readability (ensure data object includes all fields to update)
        const {
            rollNumber,
            selectedLevel,
            shownQ1,
            shownQ2,
            completedTopics,
            completedSbsTopics,
            q1Flag,
            q2Flag,
            shownSbs,
            badges
        } = data;

        // Perform an upsert operation: find the document by rollNumber and update or insert if not exists
        const updateResult = await FlagVar.updateOne(
            { roll_number: rollNumber }, // Find by rollNumber
            {
                $set: {
                    selectedLevel: selectedLevel,
                    shownQ1: shownQ1,
                    shownQ2: shownQ2,
                    completedTopics: completedTopics,
                    completedSbsTopics: completedSbsTopics,
                    q1Flag: q1Flag,
                    q2Flag: q2Flag,
                    shownSbs: shownSbs,
                    badges: badges
                }
            },
            { upsert: true } // Insert if document doesn’t exist
        );

        if (updateResult.nModified > 0 || updateResult.upserted) {
            console.log("Write operation successful:", updateResult);
            res.status(200).json({ message: "Flag variables updated successfully." });
        } else {
            res.status(400).json({ message: "No changes made to the database." });
        }
    } catch (error) {
        console.error("Error writing flag variables:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Teacher Login
app.post('/api/teachers/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const teacher = await Teacher.findOne({ email: username });
        if (teacher && await bcrypt.compare(password, teacher.password)) {
            const token = jwt.sign({ id: teacher._id }, 'your_jwt_secret');
            res.json({ token, progress: teacher.progress });
        } else {
            res.status(400).json({ message: "Invalid email or password." });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Student Leaderboard Endpoint
app.get('/api/students/leaderboard', async (req, res) => {
    try {
        const students = await Student.find({}, {
            _id: 0,
            rollNumber: 1,
            progress: 1
        }).sort({ 'progress.level': -1, 'progress.score': -1 });

        const studentLeaderboard = students.map(student => ({
            rollNumber: student.rollNumber,
            level: student.progress.level,
            score: student.progress.score
        }));

        res.json(studentLeaderboard);
    } catch (error) {
        console.error("Error fetching student leaderboard:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Evaluation Data Endpoint
app.post('/api/students/eval', async (req, res) => {
    const { roll_number, answered_correctly, total_questions } = req.body;

    try {
        // Check if the evaluation entry already exists
        let evalEntry = await StudentEval.findOne({ roll_number });
        if (evalEntry) {
            // Update the existing entry
            evalEntry.total_questions += total_questions;
            evalEntry.answered_correctly += answered_correctly;
            await evalEntry.save();
        } else {
            // Create a new entry
            evalEntry = new StudentEval({ roll_number, total_questions, answered_correctly });
            await evalEntry.save();
        }
        res.status(200).send("Evaluation data stored successfully.");
    } catch (error) {
        console.error("Error saving evaluation data:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Get Student Progress
app.get('/api/students/:rollNumber/progress', async (req, res) => {
    const { rollNumber } = req.params;

    try {
        const student = await Student.findOne({ rollNumber: parseInt(rollNumber) });
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }
        
        res.json({ level: student.progress.level, score: student.progress.score });
    } catch (error) {
        console.error("Error fetching student progress:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Evaluation Leaderboard Endpoint
app.get('/api/students/eval-leaderboard', async (req, res) => {
    try {
        console.log("request received !");
        const evalData = await StudentEval.find({}, { _id: 0 }).sort({ answered_correctly: -1 }); // Sort by correctly answered questions

        console.log(evalData);
        const evaluationLeaderboard = evalData.map(evaluation => ({
            rollNumber: evaluation.roll_number,
            correctlyAnsweredQuestions: evaluation.answered_correctly,
            totalAnsweredQuestions: evaluation.total_questions
        }));

        res.status(200).json(evaluationLeaderboard);
    } catch (error) {
        console.error("Error fetching student evaluation leaderboard:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// API to update score by 10 based on roll number
app.post('/api/students/update-score', async (req, res) => {
    console.log("Update score request received:", req.body);

    // Assuming the roll number is passed in the request body
    const { rollNumber } = req.body; // Get rollNumber from request body

    // Check if rollNumber is provided
    if (!rollNumber) {
        return res.status(400).json({ message: 'Roll number is required' });
    }

    try {
        // Find the student by roll number
        const student = await Student.findOne({ rollNumber: rollNumber });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Increment score by 10
        student.progress.score += 10;

        // Check if the score exceeds 100
        if (student.progress.score > 100) {
            student.progress.level += 1; // Increment level by 1
            student.progress.score -= 100; // Update score to score - 100
        }

        // Save the updated student document
        await student.save();

        res.json({ message: 'Score updated successfully', student });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
