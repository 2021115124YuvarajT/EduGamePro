// Function to determine if it's a student (roll number) or teacher (email)
function isRollNumber(username) {
    return !isNaN(username) && Number.isInteger(parseFloat(username)); // Checks if username is an integer (roll number)
}

function isEmail(username) {
    return username.includes('@'); // Checks if username is an email
}
 

async function fetchFlagVar() {
    const username = sessionStorage.getItem('username'); // Assuming 'username' is stored in localStorage

    try {
        const response = await fetch('http://localhost:5300/api/students/fetchFlagVar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ roll_number: username })
        });
        if (response.ok) {
            const result = await response.json();
            console.log("result is ",result);
            // Store the retrieved data in localStorage
            const { data } = result;
            console.log(data);
           // localStorage.setItem('selectedLevel', data.selectedLevel);
            localStorage.setItem('shownQ1', data.shownQ1);
            localStorage.setItem('shownQ2', data.shownQ2);
            localStorage.setItem('completedTopics', JSON.stringify(data.completedTopics));
            localStorage.setItem('completedSbsTopics', JSON.stringify(data.completedSbsTopics));
            localStorage.setItem('q1Flag', data.q1Flag);
            localStorage.setItem('q2Flag', data.q2Flag);
            localStorage.setItem('shownSbs', data.shownSbs);
            localStorage.setItem('badges', JSON.stringify(data.badges));

            console.log("Data fetched and stored in localStorage:", data);
        } else if (response.status === 404) {
            console.log("Data not found.");
        } else {
            console.error("Error fetching data:", response.statusText);
        }
    }
    catch(error){
        console.log(error);
    }
}
// Login event listener
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    let apiUrl = '';

    if (isRollNumber(username)) {
        apiUrl = 'http://localhost:5300/api/students/login'; // API for student login
    } else if (isEmail(username)) {
        apiUrl = 'http://localhost:5300/api/teachers/login'; // API for teacher login
    } else {
        alert('Invalid username format.');
        return;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed.');
        }

        const data = await response.json();

        // Store the token and progress (level, score) in session storage
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('level', data.progress.level);
        sessionStorage.setItem('score', data.progress.score);
        sessionStorage.setItem('username', username); // Store the username
        
        await fetchFlagVar();
        // Redirect based on username type
        if (isEmail(username)) {
            window.location.href = 'teacher_homepage.html'; // Redirect to teacher leaderboard
        } else {
            window.location.href = 'game1.html'; // Redirect to student dashboard
        }
    } catch (error) {
        console.error('Login failed:', error.message);
        alert(error.message); // Display the error message
    }
});

// Function to handle sign-up
document.getElementById('signupBtn').addEventListener('click', async function () {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    let apiUrl = '';

    if (isRollNumber(username)) {
        apiUrl = 'http://localhost:5300/api/students/signup'; // API for students signup
    } else if (isEmail(username)) {
        apiUrl = 'http://localhost:5300/api/teachers/signup'; // API for teachers signup
    } else {
        alert('Invalid username format.');
        return;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Sign up failed.');
        }

        alert('Registration successful!'); // Notify user of successful signup
    } catch (error) {
        console.error('Signup failed:', error.message);
        alert(error.message); // Display the error message
    }
});

// Save evaluation data
async function saveEvaluationData(rollNumber, answeredCorrectly, totalQuestions) {
    try {
        const response = await fetch('http://localhost:5300/api/students/eval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll_number: rollNumber, answered_correctly: answeredCorrectly, total_questions: totalQuestions }),
        });

        if (!response.ok) {
            throw new Error('Failed to save evaluation data.');
        }

        const result = await response.text();
        console.log(result);
    } catch (error) {
        console.error("Error during saving evaluation data:", error);
    }
}

// Example call to save evaluation data after completing an evaluation
// saveEvaluationData(sessionStorage.getItem('username'), 8, 10); // Replace with actual data
