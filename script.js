/* ==========================================================================
   CareerAI Core Engine (Voice, Saved State, DP Compressor & Dynamic Logic)
   ========================================================================== */

const DEFAULT_STATE = {
  isLoggedIn: false,
  activeTab: 'dashboard',
  profile: {
    name: "Aarav Sharma",
    email: "aarav@careerai.io",
    college: "IIT Delhi",
    targetRole: "Full Stack Developer",
    streak: 5,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
  },
  assessments: {
    DSA: { score: 48 },
    JavaScript: { score: 72 },
    React: { score: 65 },
    SQL: { score: 60 },
    "System Design": { score: 42 }
  },
  projects: [
    {
      id: "p1",
      title: "MediTrack SaaS Platform",
      desc: "Medical waste collection tracking dashboard.",
      tech: "React, Node.js, Express",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80",
      github: "https://github.com"
    }
  ],
  roadmap: [
    { id: "r1", title: "Master JavaScript Async & Event Loop", status: "COMPLETED" },
    { id: "r2", title: "Build RESTful APIs with JWT Auth", status: "IN_PROGRESS" },
    { id: "r3", title: "Solve Top 50 DSA Graph Problems", status: "PENDING" }
  ]
};

let appState = JSON.parse(localStorage.getItem('careerAI_state')) || DEFAULT_STATE;
let readinessChartInstance = null;
let isVoiceActive = false;

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();
  
  // Load Saved Theme
  const savedTheme = localStorage.getItem('careerAI_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
  }

  checkAuthAndRender();
  bindGlobalEvents();
  initQuiz();
});

function bindGlobalEvents() {
  document.getElementById('btn-fill-demo')?.addEventListener('click', () => {
    document.getElementById('login-email').value = "aarav@careerai.io";
    document.getElementById('login-password').value = "demo123";
    showToast("Demo account credentials loaded", "info");
  });

  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    appState.isLoggedIn = true;
    showToast("Successfully signed in", "success");
    saveState();
    checkAuthAndRender();
  });

  document.getElementById('signup-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    appState.profile.name = document.getElementById('signup-name').value;
    appState.profile.email = document.getElementById('signup-email').value;
    appState.profile.college = document.getElementById('signup-college').value;
    appState.profile.targetRole = document.getElementById('signup-role').value;
    appState.isLoggedIn = true;
    saveState();
    checkAuthAndRender();
    showToast("Account created successfully!", "success");
  });

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });
}

function saveState() {
  localStorage.setItem('careerAI_state', JSON.stringify(appState));
  updateUI();
}

function checkAuthAndRender() {
  const authScreen = document.getElementById('auth-screen');
  const appWrapper = document.getElementById('app-wrapper');

  if (!appState.isLoggedIn) {
    authScreen?.classList.remove('hidden');
    appWrapper?.classList.add('hidden');
  } else {
    authScreen?.classList.add('hidden');
    appWrapper?.classList.remove('hidden');
    updateUI();
  }
}

function calculateOverallReadiness() {
  const scores = Object.values(appState.assessments).map(a => a.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const projectBonus = Math.min(appState.projects.length * 5, 15);
  return Math.min(Math.round(avgScore + projectBonus), 100);
}

function updateUI() {
  // Update Profile Text
  document.getElementById('dash-user-name').innerText = `Candidate Overview: ${appState.profile.name}`;
  document.getElementById('dash-college').innerText = appState.profile.college;
  document.getElementById('dash-target-role').innerText = appState.profile.targetRole;
  document.getElementById('streak-count').innerText = appState.profile.streak;

  // Settings Pre-fill
  if (document.getElementById('settings-name')) {
    document.getElementById('settings-name').value = appState.profile.name;
    document.getElementById('settings-college').value = appState.profile.college;
    document.getElementById('settings-role').value = appState.profile.targetRole;
  }

  // Update Avatar
  if (appState.profile.avatar) {
    const avatarImg = document.getElementById('header-avatar-img');
    if (avatarImg) avatarImg.src = appState.profile.avatar;
  }

  // Calculate & Update Dynamic Score
  const overallScore = calculateOverallReadiness();
  document.getElementById('dash-readiness-score').innerText = `${overallScore}%`;

  renderReadinessChart();
  renderSkillGaps();
  renderRoadmap();
  renderProjects();

  if (window.lucide) lucide.createIcons();
}

/* THEME TOGGLE LOGIC */
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('light-theme');
  const isLight = body.classList.contains('light-theme');
  localStorage.setItem('careerAI_theme', isLight ? 'light' : 'dark');
  
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
    if (window.lucide) lucide.createIcons();
  }
}

/* IMAGE COMPRESSOR FOR LOCALSTORAGE SAFE DP STORAGE */
function handleDPChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 150;
      canvas.height = 150;
      ctx.drawImage(img, 0, 0, 150, 150);
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      appState.profile.avatar = compressedDataUrl;
      saveState();
      showToast("Profile Picture updated!", "success");
    };
  };
  reader.readAsDataURL(file);
}

function triggerDPUpload() {
  document.getElementById('dp-input')?.click();
}

/* PROFILE EDIT MODAL */
function openEditProfileModal() {
  document.getElementById('modal-name').value = appState.profile.name;
  document.getElementById('modal-college').value = appState.profile.college;
  document.getElementById('modal-role').value = appState.profile.targetRole;
  document.getElementById('edit-profile-modal')?.classList.remove('hidden');
}

function closeEditProfileModal() {
  document.getElementById('edit-profile-modal')?.classList.add('hidden');
}

function saveProfileModal(e) {
  e.preventDefault();
  appState.profile.name = document.getElementById('modal-name').value;
  appState.profile.college = document.getElementById('modal-college').value;
  appState.profile.targetRole = document.getElementById('modal-role').value;
  saveState();
  closeEditProfileModal();
  showToast("Profile updated successfully!", "success");
}

function saveSettings() {
  appState.profile.name = document.getElementById('settings-name').value;
  appState.profile.college = document.getElementById('settings-college').value;
  appState.profile.targetRole = document.getElementById('settings-role').value;
  saveState();
  showToast("Settings saved!", "success");
}

/* VOICE ASSISTANT (TTS & STT) */
function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function toggleVoiceAssistant() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Speech recognition not supported on this browser.", "info");
    speakText("Welcome to CareerAI. Your readiness score is " + calculateOverallReadiness() + " percent.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';

  if (!isVoiceActive) {
    isVoiceActive = true;
    document.getElementById('voice-btn')?.classList.add('animate-pulse');
    showToast("Listening... Speak command like 'Dashboard' or 'Projects'", "info");
    speakText("Listening for your command.");

    recognition.start();

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      showToast(`Voice Command: "${command}"`, "info");
      
      if (command.includes('dashboard')) switchTab('dashboard');
      else if (command.includes('project')) switchTab('projects');
      else if (command.includes('roadmap')) switchTab('roadmap');
      else if (command.includes('assessment')) switchTab('assessment');
      else if (command.includes('resume')) switchTab('resume');
      else if (command.includes('interview') || command.includes('viva')) switchTab('interview');
      else speakText("Command not recognized. Try saying Dashboard, Projects, or Viva.");

      stopVoice();
    };

    recognition.onerror = () => stopVoice();
    recognition.onend = () => stopVoice();
  } else {
    stopVoice();
  }
}

function stopVoice() {
  isVoiceActive = false;
  document.getElementById('voice-btn')?.classList.remove('animate-pulse');
}

/* RADAR CHART */
function renderReadinessChart() {
  const ctx = document.getElementById('readinessChart');
  if (!ctx) return;

  if (readinessChartInstance) readinessChartInstance.destroy();

  readinessChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: Object.keys(appState.assessments),
      datasets: [{
        label: 'Proficiency (%)',
        data: Object.values(appState.assessments).map(a => a.score),
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#818cf8'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          pointLabels: { color: '#94a3b8' },
          ticks: { backdropColor: 'transparent', color: '#94a3b8' }
        }
      }
    }
  });
}

function renderSkillGaps() {
  const container = document.getElementById('skill-gap-cards-container');
  if (!container) return;

  const gaps = Object.entries(appState.assessments)
    .filter(([_, data]) => data.score < 65)
    .sort((a, b) => a[1].score - b[1].score);

  container.innerHTML = gaps.map(([skill, data]) => `
    <div class="gap-card">
      <div class="flex-between font-sm">
        <strong>${skill}</strong>
        <span class="text-danger font-xs">${data.score}% Proficiency</span>
      </div>
      <p class="font-xs text-subtle mt-xs">Requires immediate practice to boost overall score.</p>
    </div>
  `).join('');
}

/* ROADMAP & TOGGLE LOGIC */
function renderRoadmap() {
  const container = document.getElementById('roadmap-tasks-container');
  if (!container) return;

  const completed = appState.roadmap.filter(r => r.status === 'COMPLETED').length;
  const pct = Math.round((completed / appState.roadmap.length) * 100) || 0;
  document.getElementById('roadmap-completion-pct').innerText = `${pct}%`;

  container.innerHTML = appState.roadmap.map(t => `
    <div class="card glass flex-between">
      <div><strong>${t.title}</strong></div>
      <button onclick="toggleRoadmapTask('${t.id}')" class="btn btn-xs ${t.status === 'COMPLETED' ? 'btn-primary' : 'btn-outline'}">
        ${t.status}
      </button>
    </div>
  `).join('');
}

function toggleRoadmapTask(id) {
  const task = appState.roadmap.find(r => r.id === id);
  if (task) {
    task.status = task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    saveState();
  }
}

/* QUIZ ASSESSMENT ENGINE */
const sampleQuiz = {
  question: "What is the primary advantage of Virtual DOM in React?",
  options: [
    { text: "Direct manipulation of HTML elements", correct: false },
    { text: "Minimizes actual DOM manipulation overhead", correct: true },
    { text: "Replaces JavaScript engine", correct: false }
  ]
};

function initQuiz() {
  const qEl = document.getElementById('quiz-question');
  const optEl = document.getElementById('quiz-options');
  if (!qEl || !optEl) return;

  qEl.innerText = sampleQuiz.question;
  optEl.innerHTML = sampleQuiz.options.map((opt, i) => `
    <button onclick="answerQuiz(${opt.correct})" class="btn btn-outline btn-full text-center">
      ${opt.text}
    </button>
  `).join('');
}

function answerQuiz(isCorrect) {
  if (isCorrect) {
    appState.assessments.React.score = Math.min(appState.assessments.React.score + 5, 100);
    showToast("Correct Answer! +5% React Score", "success");
  } else {
    showToast("Incorrect answer. Try reviewing React fundamentals.", "info");
  }
  saveState();
}

/* ATS RESUME SCANNER & EXPORTER */
function analyzeResume() {
  const text = document.getElementById('resume-text-input').value;
  if (!text) { showToast("Please paste resume text first", "info"); return; }

  const keywords = ['react', 'javascript', 'html', 'css', 'git', 'node', 'express', 'sql', 'api'];
  let count = 0;
  keywords.forEach(kw => { if (text.toLowerCase().includes(kw)) count++; });

  const score = Math.min(Math.round((count / keywords.length) * 100), 100);
  document.getElementById('resume-score-val').innerText = `${score}%`;
  document.getElementById('resume-score-display').classList.remove('hidden');
  showToast(`Resume Scan Complete: ${score}% Keyword Match`, "success");
}

function exportResumePDF() {
  const text = document.getElementById('resume-text-input')?.value;
  if (!text || text.trim() === "") {
    showToast("Please enter resume text before downloading PDF!", "info");
    return;
  }

  const pdfWrapper = document.createElement('div');
  pdfWrapper.style.padding = '20px';
  pdfWrapper.style.fontFamily = 'Arial, sans-serif';
  pdfWrapper.style.color = '#1e293b';
  pdfWrapper.style.lineHeight = '1.6';

  pdfWrapper.innerHTML = `
    <div style="border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 15px;">
      <h1 style="color: #6366f1; margin: 0;">${appState.profile.name}</h1>
      <p style="margin: 5px 0; color: #64748b;">${appState.profile.email} | ${appState.profile.college}</p>
      <p style="margin: 0; font-weight: bold; color: #4f46e5;">Target Role: ${appState.profile.targetRole}</p>
    </div>
    <div style="white-space: pre-wrap; font-size: 14px;">${text}</div>
  `;

  const opt = {
    margin:       10,
    filename:     `${appState.profile.name.replace(/\s+/g, '_')}_Resume.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  showToast("Generating PDF...", "info");
  html2pdf().set(opt).from(pdfWrapper).save().then(() => {
    showToast("Resume PDF downloaded successfully!", "success");
  });
}

/* AI VOICE MOCK INTERVIEW ENGINE */
class VoiceVivaEngine {
  constructor() {
    this.questions = [
      "Explain the key difference between Process and Thread in Operating Systems.",
      "What is the use of Promises and Async-Await in modern JavaScript?",
      "How does indexing improve database query speed?",
      "What is the core principle behind RESTful API design?"
    ];
    this.currentIndex = 0;
    this.scores = [];
  }

  startSession() {
    this.currentIndex = 0;
    this.scores = [];
    document.getElementById('btn-speak-viva')?.removeAttribute('disabled');
    this.askNextQuestion();
  }

  askNextQuestion() {
    if (this.currentIndex >= this.questions.length) {
      const avgScore = Math.round(this.scores.reduce((a, b) => a + b, 0) / this.scores.length);
      document.getElementById('viva-question-display').innerText = "Viva Completed!";
      document.getElementById('viva-status-text').innerText = `Session Finished. Overall Score: ${avgScore}%`;
      document.getElementById('viva-score-badge').innerText = `Score: ${avgScore}/100`;
      speakText(`Viva completed. Your final score is ${avgScore} percent.`);
      document.getElementById('btn-speak-viva')?.setAttribute('disabled', 'true');
      return;
    }

    const currentQ = this.questions[this.currentIndex];
    document.getElementById('viva-question-display').innerText = `Q${this.currentIndex + 1}: ${currentQ}`;
    document.getElementById('viva-status-text').innerText = "Listening to question...";
    speakText(currentQ);
  }

  listenAnswer() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Browser does not support Speech Recognition", "info");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    
    document.getElementById('viva-status-text').innerText = "Listening... Speak your answer now.";
    rec.start();

    rec.onresult = (e) => {
      const answerText = e.results[0][0].transcript;
      document.getElementById('viva-transcript-box').innerHTML = `<strong>Answer:</strong> "${answerText}"`;
      this.evaluateAnswer(answerText);
    };

    rec.onerror = () => {
      document.getElementById('viva-status-text').innerText = "Could not catch your voice. Try again.";
    };
  }

  evaluateAnswer(answerText) {
    const words = answerText.split(' ').length;
    let score = Math.min(Math.round((words / 15) * 100), 95);
    if (score < 40) score = 50;

    this.scores.push(score);
    showToast(`Answer Evaluated! Score: ${score}%`, "success");
    
    this.currentIndex++;
    setTimeout(() => this.askNextQuestion(), 2000);
  }
}

const vivaEngine = new VoiceVivaEngine();

/* PROJECTS */
function renderProjects() {
  const container = document.getElementById('projects-grid');
  if (container) {
    container.innerHTML = appState.projects.map(p => `
      <div class="card glass project-card">
        <img src="${p.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80'}" class="project-thumb" alt="Project">
        <div class="project-body">
          <h3>${p.title}</h3>
          <p class="font-xs text-subtle mt-xs">${p.desc}</p>
          <div class="flex-between mt-sm">
            <span class="badge-subtle font-xs">${p.tech}</span>
            ${p.github ? `<a href="${p.github}" target="_blank" class="btn-link font-xs">GitHub</a>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }
}

function openAddProjectModal() { document.getElementById('add-project-modal')?.classList.remove('hidden'); }
function closeAddProjectModal() { document.getElementById('add-project-modal')?.classList.add('hidden'); }

function submitNewProject(e) {
  e.preventDefault();
  appState.projects.push({
    id: Date.now().toString(),
    title: document.getElementById('proj-title').value,
    desc: document.getElementById('proj-desc').value,
    tech: document.getElementById('proj-tech').value,
    image: document.getElementById('proj-image').value,
    github: document.getElementById('proj-github').value
  });
  saveState();
  closeAddProjectModal();
  showToast("Project added successfully!", "success");
}

function switchTab(tabId) {
  appState.activeTab = tabId;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
  if (tabId === 'dashboard') setTimeout(renderReadinessChart, 50);
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab-btn-${tab}`)?.classList.add('active');
  document.getElementById('login-form')?.classList.toggle('hidden', tab !== 'login');
  document.getElementById('signup-form')?.classList.toggle('hidden', tab !== 'signup');
}

function handleLogout() {
  appState.isLoggedIn = false;
  saveState();
  checkAuthAndRender();
  showToast("Logged out successfully", "info");
}

function showToast(msg, type = "info") {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000); 
}