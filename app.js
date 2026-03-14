// app.js

// --- 1. INITIALIZE DATABASE ---
const defaultQuestions = [
    { id: 1, category: "Waste Management", q: "Which item is compostable?", options: ["Plastic cup", "Apple core", "Aluminum foil", "Glass bottle"], answer: 1 },
    { id: 2, category: "Waste Management", q: "What does the 'R' in 3R stand for?", options: ["Recycle", "Rebuild", "React", "Replant"], answer: 0 },
    { id: 3, category: "Waste Management", q: "How long does plastic take to decompose?", options: ["10 years", "50 years", "Over 400 years", "1 month"], answer: 2 },
    { id: 4, category: "Waste Management", q: "Which bin is for paper?", options: ["Blue/Green", "Red", "Black", "Yellow"], answer: 0 },
    { id: 5, category: "Waste Management", q: "What is e-waste?", options: ["Email spam", "Electronic trash", "Energy waste", "Eco-waste"], answer: 1 },
    { id: 6, category: "Climate Change", q: "What is a major greenhouse gas?", options: ["Oxygen", "Carbon Dioxide", "Argon", "Helium"], answer: 1 }
];

if (!localStorage.getItem('ecoUsers')) localStorage.setItem('ecoUsers', JSON.stringify([]));
if (!localStorage.getItem('ecoQuestions')) localStorage.setItem('ecoQuestions', JSON.stringify(defaultQuestions));

// --- 2. AUTHENTICATION ---
function handleRegister(event) {
    event.preventDefault();
    const newUser = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        school: document.getElementById('regSchool').value,
        grade: document.getElementById('regGrade').value,
        role: document.getElementById('regRole').value,
        points: 0, level: 1, history: {} 
    };
    
    let users = JSON.parse(localStorage.getItem('ecoUsers'));
    if (users.find(u => u.email === newUser.email)) return alert("Email already registered.");
    
    users.push(newUser);
    localStorage.setItem('ecoUsers', JSON.stringify(users));
    alert("Registration successful! Please login.");
    window.location.href = 'login.html';
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    let users = JSON.parse(localStorage.getItem('ecoUsers'));
    let user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = user.role === 'admin' ? 'admin.html' : 'student.html';
    } else {
        alert("Invalid email or password.");
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// --- 3. STUDENT DASHBOARD & GAMIFIED QUIZ ---
let currentQuizSession = { questions: [], currentIndex: 0, score: 0, category: "" };

function loadStudentDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'student') return window.location.href = 'login.html';

    document.getElementById('userName').innerText = user.name;
    document.getElementById('userPoints').innerText = user.points;
    document.getElementById('userLevel').innerText = user.level;

    // Load Sidebar Categories
    const questions = JSON.parse(localStorage.getItem('ecoQuestions'));
    const categories = [...new Set(questions.map(q => q.category))];
    const sidebar = document.getElementById('categoryList');
    sidebar.innerHTML = '';
    
    categories.forEach(cat => {
        sidebar.innerHTML += `<button class="topic-btn" onclick="startQuiz('${cat}')">${cat}</button>`;
    });
}

function startQuiz(category) {
    const allQuestions = JSON.parse(localStorage.getItem('ecoQuestions')).filter(q => q.category === category);
    
    if (allQuestions.length < 1) return alert("Not enough questions in this topic yet.");

    // Shuffle and pick up to 5 questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    currentQuizSession = {
        questions: shuffled.slice(0, 5),
        currentIndex: 0,
        score: 0,
        category: category
    };

    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('quizScreen').classList.remove('hidden');
    document.getElementById('quizCompleteScreen').classList.add('hidden');
    
    renderQuestion();
}

function renderQuestion() {
    const qData = currentQuizSession.questions[currentQuizSession.currentIndex];
    document.getElementById('qTopic').innerText = currentQuizSession.category;
    document.getElementById('qCount').innerText = `Question ${currentQuizSession.currentIndex + 1} of ${currentQuizSession.questions.length}`;
    
    // Progress bar
    const progress = ((currentQuizSession.currentIndex) / currentQuizSession.questions.length) * 100;
    document.getElementById('quizProgress').style.width = `${progress}%`;

    document.getElementById('quizQuestionText').innerText = qData.q;
    const optionsDiv = document.getElementById('quizOptions');
    optionsDiv.innerHTML = '';
    
    qData.options.forEach((opt, idx) => {
        optionsDiv.innerHTML += `<button class="option-btn" onclick="selectAnswer(${idx}, this)">${opt}</button>`;
    });
}

function selectAnswer(selectedIndex, btnElement) {
    const qData = currentQuizSession.questions[currentQuizSession.currentIndex];
    const buttons = document.querySelectorAll('.option-btn');
    
    // Disable all buttons
    buttons.forEach(b => b.disabled = true);

    if (selectedIndex === qData.answer) {
        btnElement.classList.add('correct');
        currentQuizSession.score += 20; // 20 pts per correct answer
    } else {
        btnElement.classList.add('wrong');
        buttons[qData.answer].classList.add('correct'); // Show correct answer
    }

    setTimeout(() => {
        currentQuizSession.currentIndex++;
        if (currentQuizSession.currentIndex < currentQuizSession.questions.length) {
            renderQuestion();
        } else {
            finishQuiz();
        }
    }, 1500);
}

function finishQuiz() {
    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('quizCompleteScreen').classList.remove('hidden');
    document.getElementById('finalScoreText').innerText = `You scored ${currentQuizSession.score} points in ${currentQuizSession.category}!`;
    
    let user = JSON.parse(localStorage.getItem('currentUser'));
    user.points += currentQuizSession.score;
    if(user.points >= 100 && user.level === 1) user.level = 2;
    if(user.points >= 300 && user.level === 2) user.level = 3;
    
    // Save to DB
    let users = JSON.parse(localStorage.getItem('ecoUsers'));
    users[users.findIndex(u => u.email === user.email)] = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('ecoUsers', JSON.stringify(users));

    document.getElementById('userPoints').innerText = user.points;
    document.getElementById('userLevel').innerText = user.level;
}

// --- 4. ADMIN DASHBOARD ---
function loadAdminDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'admin') return window.location.href = 'login.html';
    
    document.getElementById('adminName').innerText = user.name;
    renderAdminData();
}

function renderAdminData() {
    let users = JSON.parse(localStorage.getItem('ecoUsers'));
    let questions = JSON.parse(localStorage.getItem('ecoQuestions'));
    
    let students = users.filter(u => u.role === 'student');
    document.getElementById('statTotalStudents').innerText = students.length;
    document.getElementById('statTotalQuestions').innerText = questions.length;
    
    // Render Users Table
    const uBody = document.getElementById('adminUserTable');
    uBody.innerHTML = users.map(u => `
        <tr>
            <td>${u.name}</td>
            <td>${u.role.toUpperCase()}</td>
            <td>${u.school || 'N/A'}</td>
            <td>${u.points}</td>
        </tr>
    `).join('');

    // Render Questions Table
    const qBody = document.getElementById('adminQuestionTable');
    qBody.innerHTML = questions.map(q => `
        <tr>
            <td>${q.category}</td>
            <td>${q.q}</td>
            <td><button class="danger" style="padding: 5px 10px; margin:0;" onclick="deleteQuestion(${q.id})">Delete</button></td>
        </tr>
    `).join('');
}

function addNewQuestion(event) {
    event.preventDefault();
    let questions = JSON.parse(localStorage.getItem('ecoQuestions'));
    
    const newQ = {
        id: Date.now(),
        category: document.getElementById('addQCategory').value,
        q: document.getElementById('addQText').value,
        options: [
            document.getElementById('addQOpt1').value,
            document.getElementById('addQOpt2').value,
            document.getElementById('addQOpt3').value,
            document.getElementById('addQOpt4').value
        ],
        answer: parseInt(document.getElementById('addQAns').value)
    };

    questions.push(newQ);
    localStorage.setItem('ecoQuestions', JSON.stringify(questions));
    event.target.reset();
    renderAdminData();
    alert("Question added successfully!");
}

function deleteQuestion(id) {
    if(!confirm("Delete this question?")) return;
    let questions = JSON.parse(localStorage.getItem('ecoQuestions'));
    questions = questions.filter(q => q.id !== id);
    localStorage.setItem('ecoQuestions', JSON.stringify(questions));
    renderAdminData();
}