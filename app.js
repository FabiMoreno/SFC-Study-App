const USERS = {
  "Ayelén": { initial: "A" },
  "Sam": { initial: "S" }
};

const viewCopy = {
  study: {
    title: "Study smarter for your Scrum Fundamentals exam.",
    description: "Review concepts, answer exam-style questions, and learn from each explanation."
  },
  practice: {
    title: "Practice without the pressure of a full exam.",
    description: "Short randomized sets with scored results will be added in the next milestone."
  },
  mock: {
    title: "Simulate the real SFC™ exam experience.",
    description: "The mock exam will use 40 questions, a 60-minute timer, and results at the end."
  },
  dashboard: {
    title: "Turn every answer into useful study insight.",
    description: "Historical scores, weak areas, and Ayelén vs Sam comparisons will live here."
  }
};

const modal = document.querySelector("#user-modal");
const currentUserButton = document.querySelector("#current-user");
const userName = document.querySelector("#user-name");
const userAvatar = document.querySelector("#user-avatar");
const heroUser = document.querySelector("#hero-user");
const viewTitle = document.querySelector("#view-title");
const viewDescription = document.querySelector("#view-description");
const workspace = document.querySelector("#workspace");
const navLinks = document.querySelectorAll(".nav-link");
const userOptions = document.querySelectorAll(".user-option");

let selectedUser = null;
let activeView = "study";
let filteredQuestions = [...QUESTION_BANK];
let currentQuestionIndex = 0;
let selectedAnswer = null;
let answerRevealed = false;
let currentCategory = "All topics";

function storageKey() {
  return `sfcStudyStats:${selectedUser || "guest"}`;
}

function getStudyStats() {
  const fallback = { correct: 0, incorrect: 0, answered: {} };
  try {
    return JSON.parse(localStorage.getItem(storageKey())) || fallback;
  } catch {
    return fallback;
  }
}

function saveStudyResult(questionId, wasCorrect) {
  if (!selectedUser) return;
  const stats = getStudyStats();

  if (!stats.answered[questionId]) {
    stats.answered[questionId] = { correct: 0, incorrect: 0 };
  }

  if (wasCorrect) {
    stats.correct += 1;
    stats.answered[questionId].correct += 1;
  } else {
    stats.incorrect += 1;
    stats.answered[questionId].incorrect += 1;
  }

  localStorage.setItem(storageKey(), JSON.stringify(stats));
}

function openUserModal() {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeUserModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function selectUser(name) {
  const profile = USERS[name];
  if (!profile) return;

  selectedUser = name;
  sessionStorage.setItem("sfcCurrentUser", name);

  userName.textContent = name;
  userAvatar.textContent = profile.initial;
  heroUser.textContent = name;

  closeUserModal();
  renderCurrentView();
}

function changeView(view) {
  const copy = viewCopy[view];
  if (!copy) return;

  activeView = view;
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });

  viewTitle.textContent = copy.title;
  viewDescription.textContent = copy.description;
  renderCurrentView();
}

function renderCurrentView() {
  if (activeView === "study") {
    renderStudy();
    return;
  }

  renderComingSoon(activeView);
}

function renderComingSoon(view) {
  const labels = {
    practice: ["Practice mode", "10- and 20-question scored sessions are the next step."],
    mock: ["Mock Exam", "A 40-question, 60-minute simulation will be added after Practice mode."],
    dashboard: ["Dashboard", "Historical analytics will be connected after the Supabase data model is ready."]
  };

  const [title, copy] = labels[view];
  workspace.innerHTML = `
    <div class="placeholder-card">
      <span class="placeholder-icon">◎</span>
      <div>
        <span class="section-kicker">Coming next</span>
        <h2>${title}</h2>
        <p>${copy}</p>
      </div>
    </div>
  `;
}

function getCategories() {
  return ["All topics", ...new Set(QUESTION_BANK.map((item) => item.category))];
}

function renderStudy() {
  if (!filteredQuestions.length) filteredQuestions = [...QUESTION_BANK];

  const question = filteredQuestions[currentQuestionIndex] || filteredQuestions[0];
  const stats = getStudyStats();
  const total = stats.correct + stats.incorrect;
  const accuracy = total ? Math.round((stats.correct / total) * 100) : 0;

  workspace.innerHTML = `
    <div class="study-toolbar">
      <div>
        <span class="section-kicker">Study mode</span>
        <h2>Interactive flashcards</h2>
        <p>Choose an answer, reveal the explanation, then mark whether you got it right.</p>
      </div>
      <div class="study-controls">
        <label>
          <span>Topic</span>
          <select id="category-filter">
            ${getCategories().map((category) => `<option value="${category}" ${category === currentCategory ? "selected" : ""}>${category}</option>`).join("")}
          </select>
        </label>
        <button class="button button-secondary" id="shuffle-study" type="button">Shuffle</button>
      </div>
    </div>

    <div class="study-stats" aria-label="Study statistics">
      <div><strong>${stats.correct}</strong><span>Correct</span></div>
      <div><strong>${stats.incorrect}</strong><span>Incorrect</span></div>
      <div><strong>${accuracy}%</strong><span>Accuracy</span></div>
      <div><strong>${filteredQuestions.length}</strong><span>Cards</span></div>
    </div>

    <div class="study-progress">
      <div style="width:${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%"></div>
    </div>

    <article class="flashcard">
      <div class="flashcard-meta">
        <div>
          <span class="topic-pill">${question.category}</span>
          <span class="topic-name">${question.topic}</span>
        </div>
        <span>${currentQuestionIndex + 1} / ${filteredQuestions.length}</span>
      </div>

      <h3 class="flashcard-question">${question.question}</h3>

      <div class="answer-options" id="answer-options">
        ${question.options.map((option, index) => `
          <button class="answer-option" type="button" data-answer="${index}">
            <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
            <span>${option}</span>
          </button>
        `).join("")}
      </div>

      <div class="answer-explanation" id="answer-explanation" hidden>
        <span class="answer-label">Correct answer</span>
        <strong id="correct-answer-text"></strong>
        <p id="answer-copy"></p>
        <small id="answer-sbok"></small>
      </div>

      <div class="flashcard-actions">
        <button class="button button-ghost" id="previous-card" type="button" ${currentQuestionIndex === 0 ? "disabled" : ""}>← Previous</button>
        <div class="flashcard-main-actions">
          <button class="button button-primary" id="reveal-answer" type="button">Reveal answer</button>
          <button class="button result-correct" id="mark-correct" type="button" hidden>I got it right</button>
          <button class="button result-wrong" id="mark-wrong" type="button" hidden>I got it wrong</button>
        </div>
        <button class="button button-ghost" id="next-card" type="button">Next →</button>
      </div>
    </article>

    <p class="study-note">This local progress is temporary and device-specific. The next backend milestone will move attempts and history to Supabase.</p>
  `;

  bindStudyEvents(question);
}

function bindStudyEvents(question) {
  const optionButtons = document.querySelectorAll(".answer-option");
  const revealButton = document.querySelector("#reveal-answer");
  const correctButton = document.querySelector("#mark-correct");
  const wrongButton = document.querySelector("#mark-wrong");
  const previousButton = document.querySelector("#previous-card");
  const nextButton = document.querySelector("#next-card");
  const filter = document.querySelector("#category-filter");
  const shuffleButton = document.querySelector("#shuffle-study");

  optionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (answerRevealed) return;
      selectedAnswer = Number(button.dataset.answer);
      optionButtons.forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  revealButton.addEventListener("click", () => {
    answerRevealed = true;

    optionButtons.forEach((button) => {
      const optionIndex = Number(button.dataset.answer);
      if (optionIndex === question.correctAnswer) button.classList.add("correct");
      if (selectedAnswer === optionIndex && optionIndex !== question.correctAnswer) button.classList.add("incorrect");
      button.disabled = true;
    });

    document.querySelector("#correct-answer-text").textContent =
      `${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}`;
    document.querySelector("#answer-copy").textContent = question.explanation;
    document.querySelector("#answer-sbok").textContent = question.sbok;
    document.querySelector("#answer-explanation").hidden = false;

    revealButton.hidden = true;
    correctButton.hidden = false;
    wrongButton.hidden = false;
  });

  correctButton.addEventListener("click", () => {
    saveStudyResult(question.id, true);
    goToNextCard();
  });

  wrongButton.addEventListener("click", () => {
    saveStudyResult(question.id, false);
    goToNextCard();
  });

  previousButton.addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex -= 1;
      resetCardState();
      renderStudy();
    }
  });

  nextButton.addEventListener("click", goToNextCard);

  filter.addEventListener("change", () => {
    currentCategory = filter.value;
    filteredQuestions = currentCategory === "All topics"
      ? [...QUESTION_BANK]
      : QUESTION_BANK.filter((item) => item.category === currentCategory);
    currentQuestionIndex = 0;
    resetCardState();
    renderStudy();
  });

  shuffleButton.addEventListener("click", () => {
    filteredQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5);
    currentQuestionIndex = 0;
    resetCardState();
    renderStudy();
  });
}

function resetCardState() {
  selectedAnswer = null;
  answerRevealed = false;
}

function goToNextCard() {
  currentQuestionIndex = (currentQuestionIndex + 1) % filteredQuestions.length;
  resetCardState();
  renderStudy();
}

userOptions.forEach((button) => {
  button.addEventListener("click", () => selectUser(button.dataset.user));
});

currentUserButton.addEventListener("click", openUserModal);

navLinks.forEach((button) => {
  button.addEventListener("click", () => changeView(button.dataset.view));
});

const sessionUser = sessionStorage.getItem("sfcCurrentUser");
if (sessionUser && USERS[sessionUser]) {
  selectedUser = sessionUser;
  userName.textContent = sessionUser;
  userAvatar.textContent = USERS[sessionUser].initial;
  heroUser.textContent = sessionUser;
}

renderCurrentView();
openUserModal();
