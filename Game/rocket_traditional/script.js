let name = localStorage.getItem("name");
let studentClass = localStorage.getItem("class");
let topic = localStorage.getItem("topic");

let currentQuestion = 0;
let questions = [];
let correctAnswers = 0;
let startTime;

window.onload = async () => {
    try {
        const res = await fetch("http://localhost:5200/get_questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic }),
        });          
  
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
  
      const data = await res.json();
      questions = data.questions;
      startTime = Date.now();
  
      if (!questions || questions.length === 0) {
        alert("No questions found for selected topic.");
        window.location.href = "index.html";
        return;
      }
  
      showQuestion();
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Could not load questions. Please try again.");
      window.location.href = "index.html";
    }
};  

function showQuestion() {
  if (currentQuestion >= questions.length) {
    finishQuiz();
    return;
  }

  const q = questions[currentQuestion];
  document.getElementById("question").innerText = q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach((opt, index) => {
    const optBtn = document.createElement("button");
    optBtn.innerText = opt;
    optBtn.onclick = () => {
      if ("abcd"[index] === q.answer.toLowerCase()) correctAnswers++;
      currentQuestion++;
      showQuestion();
    };
    optionsDiv.appendChild(optBtn);
    optionsDiv.appendChild(document.createElement("br"));
  });

  document.getElementById("progress").innerText = `Question ${currentQuestion + 1} of ${questions.length}`;
}

function finishQuiz() {
  let totalTimeTaken = (Date.now() - startTime) / 1000; // in seconds
  let psi = totalTimeTaken > 0 ? (correctAnswers / totalTimeTaken) : 0;
  let ati = Math.round((correctAnswers / questions.length) * 100); 

  fetch("http://localhost:5200/submit_results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      class: studentClass,
      topic,
      psi: psi.toFixed(2),
      ati: ati.toFixed(2),
    }),
  })
  alert(`Quiz Finished!\nPSI: ${psi.toFixed(2)}\nATI: ${ati}`);
  
  // Clear localStorage to prevent auto-starting quiz again
  localStorage.removeItem("name");
  localStorage.removeItem("class");
  localStorage.removeItem("topic");

  // Redirect to index.html after a short pause
  setTimeout(() => {
    window.location.href = "index.html";
  }, 500); 
}
