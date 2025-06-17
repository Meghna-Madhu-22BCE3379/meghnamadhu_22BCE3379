let currentUser = null;
let currentQuestion = 0;
let score = 0;
let questions = [];
let isLoginMode = true;
let authToken = null;

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("visible"));
    document.getElementById(screenId).classList.add("visible");
}

// 🔄 Toggle Login/Register UI
function updateAuthUI() {
    document.getElementById("auth-title").textContent = isLoginMode ? "Login" : "Register";
    document.getElementById("login-btn").textContent = isLoginMode ? "Login" : "Register";
    document.getElementById("toggle-text").innerHTML = isLoginMode
        ? `Don't have an account? <span id="toggle-link" style="color:blue;cursor:pointer;">Register</span>`
        : `Already have an account? <span id="toggle-link" style="color:blue;cursor:pointer;">Login</span>`;

    document.getElementById("toggle-link").addEventListener("click", () => {
        isLoginMode = !isLoginMode;
        updateAuthUI();
    });
}
updateAuthUI();

// 🔐 Handle Auth Form Submit
document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) return alert("Please enter email and password");

    if (isLoginMode) {
        await loginUser(email, password);
    } else {
        await registerUser(email, password);
    }
});

async function registerUser(email, password) {
    try {
        const res = await fetch("http://127.0.0.1:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        alert("Registered successfully! You can now log in.");
        isLoginMode = true;
        updateAuthUI();
    } catch (err) {
        alert("Registration error: " + err.message);
    }
}

async function loginUser(email, password) {
    try {
        const res = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        currentUser = email;
        authToken = data.token;
        showScreen("login-screen");

        document.getElementById("start-btn").addEventListener("click", () => {
            showScreen("quiz-screen");
            startQuiz();
        });
    } catch (err) {
        alert("Login failed: " + err.message);
    }
}

// 🧠 Fetch Questions
async function fetchQuestions() {
    try {
        const res = await fetch("http://127.0.0.1:5000/questions");
        questions = await res.json();
    } catch (err) {
        alert("Failed to fetch questions: " + err.message);
    }
}

// ▶️ Start Quiz
async function startQuiz() {
    await fetchQuestions();
    if (questions.length === 0) {
        alert("No questions found in database.");
        return;
    }
    currentQuestion = 0;
    score = 0;
    loadQuestion();
}

// ❓ Load Question
function loadQuestion() {
    const q = questions[currentQuestion];
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    const nextBtn = document.getElementById("next-btn");

    questionText.innerHTML = `${q.question}`;
    if (currentUser === "meghnamadhu24@gmail.com") {
        questionText.innerHTML += `
            <button onclick="editCurrentQuestion()" style="margin-left:10px;">✏️ Edit</button>
            <button onclick="deleteCurrentQuestion()" style="margin-left:5px;">🗑️ Delete</button>
        `;
    }

    optionsContainer.innerHTML = "";
    nextBtn.disabled = true;

    q.options.forEach(option => {
        const btn = document.createElement("div");
        btn.textContent = option;
        btn.classList.add("option");
        btn.addEventListener("click", () => selectOption(btn, q.correctAnswer));
        optionsContainer.appendChild(btn);
    });
}

// ✅ Option Selection
function selectOption(selectedBtn, correctAnswer) {
    document.querySelectorAll(".option").forEach(btn => btn.classList.remove("selected"));
    selectedBtn.classList.add("selected");
    document.getElementById("next-btn").disabled = false;

    if (selectedBtn.textContent === correctAnswer) score++;
}

// ⏭ Next Question
document.getElementById("next-btn").addEventListener("click", () => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
        loadQuestion();
    } else {
        showResults();
    }
});

// 🏁 Show Results
function showResults() {
    showScreen("result-screen");
    document.getElementById("final-score").textContent = `${score}/${questions.length}`;

    document.getElementById("logout-btn").addEventListener("click", () => {
        currentUser = null;
        authToken = null;
        location.reload();
    });
}

// 🔁 Reset Quiz
document.getElementById("play-again-btn").addEventListener("click", () => {
    currentQuestion = 0;
    score = 0;
    showScreen("auth-screen");
    document.getElementById("leaderboard-form").reset();
    document.getElementById("leaderboard-list").innerHTML = "";
});

// 🏆 Leaderboard Submission
document.getElementById("leaderboard-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    if (!username) return;

    try {
        await fetch("http://127.0.0.1:5000/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: username,
                score: score,
                date: new Date()
            })
        });
        loadLeaderboard();
    } catch (err) {
        alert("Error saving to leaderboard: " + err.message);
    }
});

// 🏆 Load Leaderboard
async function loadLeaderboard() {
    try {
        const res = await fetch("http://127.0.0.1:5000/leaderboard");
        const topScores = await res.json();
        const leaderboardList = document.getElementById("leaderboard-list");
        leaderboardList.innerHTML = "";
        topScores.forEach(entry => {
            const li = document.createElement("li");
            li.textContent = `${entry.name} - ${entry.score}`;
            leaderboardList.appendChild(li);
        });
    } catch (err) {
        alert("Error loading leaderboard: " + err.message);
    }
}

// ✏️ Edit Question
async function editCurrentQuestion() {
    const q = questions[currentQuestion];
    const newQuestion = prompt("Edit question:", q.question);
    if (!newQuestion) return;

    const newOptions = [];
    for (let i = 0; i < q.options.length; i++) {
        const updated = prompt(`Edit option ${i + 1}:`, q.options[i]);
        if (!updated) return;
        newOptions.push(updated);
    }

    const newCorrect = prompt("Correct answer:", q.correctAnswer);
    if (!newOptions.includes(newCorrect)) {
        alert("Correct answer must match one of the options.");
        return;
    }

    try {
        await fetch(`http://127.0.0.1:5000/question/${q._id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: newQuestion,
                options: newOptions,
                correctAnswer: newCorrect
            })
        });
        alert("Question updated!");
        await fetchQuestions();
        loadQuestion();
    } catch (err) {
        alert("Failed to update question: " + err.message);
    }
}

// 🗑️ Delete Question
async function deleteCurrentQuestion() {
    const q = questions[currentQuestion];
    const confirmDelete = confirm("Are you sure you want to delete this question?");
    if (!confirmDelete) return;

    try {
        await fetch(`http://127.0.0.1:5000/question/${q._id}`, {
            method: "DELETE"
        });
        alert("Question deleted!");
        await fetchQuestions();
        if (currentQuestion >= questions.length) currentQuestion = 0;
        loadQuestion();
    } catch (err) {
        alert("Failed to delete question: " + err.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    showScreen("auth-screen");
});
