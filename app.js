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
    description: "Take a 10- or 20-question session, then review your score, weak topics, and mistakes."
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

let practiceSession = null;

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function studyStorageKey() {
  return `sfcStudyStats:${selectedUser || "guest"}`;
}

function practiceHistoryKey() {
  return `sfcPracticeHistory:${selectedUser || "guest"}`;
}

function getStudyStats() {
  const fallback = { correct: 0, incorrect: 0, answered: {} };

  try {
    return JSON.parse(localStorage.getItem(studyStorageKey())) || fallback;
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

  localStorage.setItem(studyStorageKey(), JSON.stringify(stats));
}

function getPracticeHistory() {
  try {
    return JSON.parse(localStorage.getItem(practiceHistoryKey())) || [];
  } catch {
    return [];
  }
}

function savePracticeAttempt(attempt) {
  if (!selectedUser) return;

  const history = getPracticeHistory();
  history.unshift(attempt);

  localStorage.setItem(
    practiceHistoryKey(),
    JSON.stringify(history.slice(0, 50))
  );
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

  const userChanged = selectedUser && selectedUser !== name;

  selectedUser = name;
  sessionStorage.setItem("sfcCurrentUser", name);

  userName.textContent = name;
  userAvatar.textContent = profile.initial;
  heroUser.textContent = name;

  if (userChanged) {
    practiceSession = null;
    resetCardState();
  }

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

  if (activeView === "practice") {
    renderPractice();
    return;
  }

  renderComingSoon(activeView);
}

function renderComingSoon(view) {
  const labels = {
    mock: ["Mock Exam", "A 40-question, 60-minute simulation will be added after the question bank moves to Supabase."],
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
            ${getCategories().map((category) =>
              `<option value="${category}" ${category === currentCategory ? "selected" : ""}>${category}</option>`
            ).join("")}
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

    <p class="study-note">Study progress is temporarily stored on this device. Supabase will replace this local storage in a later milestone.</p>
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

      if (optionIndex === question.correctAnswer) {
        button.classList.add("correct");
      }

      if (selectedAnswer === optionIndex && optionIndex !== question.correctAnswer) {
        button.classList.add("incorrect");
      }

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
    filteredQuestions = shuffleArray(filteredQuestions);
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

function startPractice(questionCount) {
  const safeCount = Math.min(questionCount, QUESTION_BANK.length);

  practiceSession = {
    id: `practice-${Date.now()}`,
    questions: shuffleArray(QUESTION_BANK).slice(0, safeCount),
    answers: {},
    currentIndex: 0,
    startedAt: Date.now(),
    completed: false,
    result: null
  };

  renderPractice();
}

function renderPractice() {
  if (!practiceSession) {
    renderPracticeSetup();
    return;
  }

  if (practiceSession.completed) {
    renderPracticeResults();
    return;
  }

  renderPracticeQuestion();
}

function renderPracticeSetup() {
  const recentAttempts = getPracticeHistory().slice(0, 3);

  workspace.innerHTML = `
    <div class="practice-intro">
      <div>
        <span class="section-kicker">Practice mode</span>
        <h2>Choose your session length</h2>
        <p>Answers stay hidden until the end so the session feels closer to an exam. No timer yet.</p>
      </div>

      <div class="practice-size-grid">
        <button class="practice-size-card" type="button" data-practice-size="10">
          <span>Quick practice</span>
          <strong>10 questions</strong>
          <small>Best for a short review session</small>
          <b>Start →</b>
        </button>

        <button class="practice-size-card" type="button" data-practice-size="20">
          <span>Deep practice</span>
          <strong>20 questions</strong>
          <small>Better topic coverage and a stronger signal</small>
          <b>Start →</b>
        </button>
      </div>
    </div>

    ${recentAttempts.length ? `
      <section class="recent-practice">
        <div class="section-heading">
          <div>
            <span class="section-kicker">On this device</span>
            <h3>Recent practice sessions</h3>
          </div>
        </div>

        <div class="recent-attempt-list">
          ${recentAttempts.map((attempt) => `
            <div class="recent-attempt-row">
              <div>
                <strong>${attempt.percentage}%</strong>
                <span>${attempt.correct}/${attempt.total} correct</span>
              </div>
              <div>
                <strong>${new Date(attempt.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong>
                <span>${attempt.total}-question practice</span>
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    ` : ""}
  `;

  document.querySelectorAll("[data-practice-size]").forEach((button) => {
    button.addEventListener("click", () => {
      startPractice(Number(button.dataset.practiceSize));
    });
  });
}

function renderPracticeQuestion() {
  const session = practiceSession;
  const question = session.questions[session.currentIndex];
  const currentSelection = session.answers[question.id];
  const answeredCount = Object.keys(session.answers).length;
  const isLastQuestion = session.currentIndex === session.questions.length - 1;

  workspace.innerHTML = `
    <div class="practice-session-header">
      <div>
        <span class="section-kicker">Practice session</span>
        <h2>${session.questions.length} questions</h2>
      </div>

      <div class="practice-session-meta">
        <div><strong>${answeredCount}</strong><span>Answered</span></div>
        <div><strong>${session.questions.length - answeredCount}</strong><span>Remaining</span></div>
      </div>
    </div>

    <div class="study-progress">
      <div style="width:${((session.currentIndex + 1) / session.questions.length) * 100}%"></div>
    </div>

    <article class="flashcard practice-card">
      <div class="flashcard-meta">
        <div>
          <span class="topic-pill">${question.category}</span>
          <span class="topic-name">${question.topic}</span>
        </div>
        <span>Question ${session.currentIndex + 1} of ${session.questions.length}</span>
      </div>

      <h3 class="flashcard-question">${question.question}</h3>

      <div class="answer-options">
        ${question.options.map((option, index) => `
          <button class="answer-option ${currentSelection === index ? "selected" : ""}" type="button" data-practice-answer="${index}">
            <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
            <span>${option}</span>
          </button>
        `).join("")}
      </div>

      <div class="practice-navigation">
        <button class="button button-ghost" id="practice-previous" type="button" ${session.currentIndex === 0 ? "disabled" : ""}>← Previous</button>

        <span class="practice-no-feedback">Answers are reviewed after submission.</span>

        <button
          class="button ${isLastQuestion ? "button-primary" : "button-secondary"}"
          id="${isLastQuestion ? "finish-practice" : "practice-next"}"
          type="button"
          ${currentSelection === undefined ? "disabled" : ""}
        >
          ${isLastQuestion ? "Finish practice" : "Next →"}
        </button>
      </div>
    </article>

    <div class="practice-question-dots" aria-label="Question navigation">
      ${session.questions.map((item, index) => {
        const isAnswered = session.answers[item.id] !== undefined;
        return `
          <button
            class="practice-dot ${index === session.currentIndex ? "current" : ""} ${isAnswered ? "answered" : ""}"
            type="button"
            data-practice-question="${index}"
            aria-label="Go to question ${index + 1}"
          >${index + 1}</button>
        `;
      }).join("")}
    </div>
  `;

  bindPracticeQuestionEvents(question);
}

function bindPracticeQuestionEvents(question) {
  const answerButtons = document.querySelectorAll("[data-practice-answer]");

  answerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      practiceSession.answers[question.id] = Number(button.dataset.practiceAnswer);
      renderPracticeQuestion();
    });
  });

  document.querySelector("#practice-previous")?.addEventListener("click", () => {
    practiceSession.currentIndex -= 1;
    renderPracticeQuestion();
  });

  document.querySelector("#practice-next")?.addEventListener("click", () => {
    practiceSession.currentIndex += 1;
    renderPracticeQuestion();
  });

  document.querySelector("#finish-practice")?.addEventListener("click", () => {
    const allAnswered = practiceSession.questions.every(
      (item) => practiceSession.answers[item.id] !== undefined
    );

    if (!allAnswered) return;

    finishPractice();
  });

  document.querySelectorAll("[data-practice-question]").forEach((button) => {
    button.addEventListener("click", () => {
      practiceSession.currentIndex = Number(button.dataset.practiceQuestion);
      renderPracticeQuestion();
    });
  });
}

function finishPractice() {
  const session = practiceSession;
  const completedAt = new Date().toISOString();

  const answerResults = session.questions.map((question) => {
    const selected = session.answers[question.id];

    return {
      questionId: question.id,
      selectedAnswer: selected,
      correctAnswer: question.correctAnswer,
      isCorrect: selected === question.correctAnswer,
      category: question.category,
      topic: question.topic
    };
  });

  const correct = answerResults.filter((item) => item.isCorrect).length;
  const total = session.questions.length;
  const percentage = Math.round((correct / total) * 100);
  const durationSeconds = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));

  const result = {
    id: session.id,
    mode: "practice",
    user: selectedUser,
    completedAt,
    total,
    correct,
    incorrect: total - correct,
    percentage,
    durationSeconds,
    answers: answerResults
  };

  session.completed = true;
  session.result = result;

  savePracticeAttempt(result);
  renderPracticeResults();
}

function getCategoryBreakdown(result) {
  const breakdown = {};

  result.answers.forEach((answer) => {
    if (!breakdown[answer.category]) {
      breakdown[answer.category] = { correct: 0, total: 0 };
    }

    breakdown[answer.category].total += 1;

    if (answer.isCorrect) {
      breakdown[answer.category].correct += 1;
    }
  });

  return Object.entries(breakdown)
    .map(([category, values]) => ({
      category,
      ...values,
      percentage: Math.round((values.correct / values.total) * 100)
    }))
    .sort((a, b) => a.percentage - b.percentage);
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (!minutes) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

function renderPracticeResults() {
  const result = practiceSession.result;
  const breakdown = getCategoryBreakdown(result);
  const missedAnswers = result.answers.filter((answer) => !answer.isCorrect);

  workspace.innerHTML = `
    <section class="practice-results">
      <div class="result-hero">
        <div>
          <span class="section-kicker">Practice complete</span>
          <h2>${result.percentage}%</h2>
          <p>${result.correct} of ${result.total} questions correct · ${formatDuration(result.durationSeconds)}</p>
        </div>

        <div class="result-message ${result.percentage >= 85 ? "strong" : result.percentage >= 75 ? "good" : "needs-work"}">
          <strong>${
            result.percentage >= 85
              ? "Strong practice result"
              : result.percentage >= 75
                ? "Good foundation"
                : "Keep reinforcing the weak areas"
          }</strong>
          <span>Your study target is consistent scores of 85% or higher.</span>
        </div>
      </div>

      <div class="result-summary-grid">
        <div><strong>${result.correct}</strong><span>Correct</span></div>
        <div><strong>${result.incorrect}</strong><span>Incorrect</span></div>
        <div><strong>${result.percentage}%</strong><span>Accuracy</span></div>
        <div><strong>${formatDuration(result.durationSeconds)}</strong><span>Duration</span></div>
      </div>

      <section class="result-section">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Topic performance</span>
            <h3>Where to focus next</h3>
          </div>
        </div>

        <div class="topic-breakdown">
          ${breakdown.map((item) => `
            <div class="topic-breakdown-row">
              <div>
                <strong>${item.category}</strong>
                <span>${item.correct}/${item.total} correct</span>
              </div>
              <div class="topic-score">
                <span>${item.percentage}%</span>
                <div><i style="width:${item.percentage}%"></i></div>
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="result-section">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Review</span>
            <h3>${missedAnswers.length ? "Questions to revisit" : "No missed questions"}</h3>
          </div>
        </div>

        ${missedAnswers.length ? `
          <div class="mistake-list">
            ${missedAnswers.map((answer) => {
              const question = QUESTION_BANK.find((item) => item.id === answer.questionId);

              return `
                <article class="mistake-card">
                  <div class="flashcard-meta">
                    <div>
                      <span class="topic-pill">${question.category}</span>
                      <span class="topic-name">${question.topic}</span>
                    </div>
                  </div>

                  <h4>${question.question}</h4>

                  <div class="mistake-answer wrong-line">
                    <span>Your answer</span>
                    <strong>${String.fromCharCode(65 + answer.selectedAnswer)}. ${question.options[answer.selectedAnswer]}</strong>
                  </div>

                  <div class="mistake-answer correct-line">
                    <span>Correct answer</span>
                    <strong>${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}</strong>
                  </div>

                  <p>${question.explanation}</p>
                  <small>${question.sbok}</small>
                </article>
              `;
            }).join("")}
          </div>
        ` : `
          <div class="perfect-result">
            <strong>Excellent work.</strong>
            <span>You answered every question in this session correctly.</span>
          </div>
        `}
      </section>

      <div class="result-actions">
        <button class="button button-primary" id="new-practice" type="button">Start another practice</button>
        <button class="button button-secondary" id="back-to-study" type="button">Go to Study</button>
      </div>
    </section>
  `;

  document.querySelector("#new-practice").addEventListener("click", () => {
    practiceSession = null;
    renderPractice();
  });

  document.querySelector("#back-to-study").addEventListener("click", () => {
    changeView("study");
  });
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
