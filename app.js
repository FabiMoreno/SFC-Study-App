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
    description: "Track synced scores, topic performance, recurring misses, and Ayelén vs Sam progress."
  }
};

const modal = document.querySelector("#user-modal");
const currentUserButton = document.querySelector("#current-user");
const userName = document.querySelector("#user-name");
const userAvatar = document.querySelector("#user-avatar");
const heroUser = document.querySelector("#hero-user");
const syncStatus = document.querySelector("#sync-status");
const viewTitle = document.querySelector("#view-title");
const viewDescription = document.querySelector("#view-description");
const workspace = document.querySelector("#workspace");
const navLinks = document.querySelectorAll(".nav-link");
const userOptions = document.querySelectorAll(".user-option");
const modalNote = document.querySelector(".modal-note");
const appHeader = document.querySelector(".app-header");

let profiles = [];
let QUESTION_BANK = [];
let selectedUser = null;
let activeView = "study";
let backendReady = false;

let studyReviews = [];
let practiceHistory = [];

let filteredQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;
let answerRevealed = false;
let currentCategory = "All topics";

let practiceSession = null;
let mockSession = null;
let mockTimerId = null;

let dashboardMode = "personal";
let dashboardData = null;
let dashboardLoading = false;

function currentProfile() {
  return profiles.find((profile) => profile.name === selectedUser) || null;
}

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function normalizeQuestion(row) {
  return {
    id: row.id,
    category: row.topics?.category || "Other",
    topic: row.topics?.topic || "General",
    subtopic: row.topics?.subtopic || "",
    question: row.question_text,
    options: Array.isArray(row.options) ? row.options : [],
    difficulty: row.difficulty,
    sbok: row.sbok_reference || "",
    studyEnabled: row.study_enabled,
    practiceEnabled: row.practice_enabled,
    mockEnabled: row.mock_enabled
  };
}

function openUserModal() {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeUserModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function setUserUi(name) {
  const fallback = USERS[name] || { initial: name?.[0] || "?" };
  userName.textContent = name || "Choose user";
  userAvatar.textContent = fallback.initial;
  heroUser.textContent = name || "Select a user";
}

async function loadLearnerData(profileId) {
  const [reviews, attempts] = await Promise.all([
    SFCBackend.getStudyReviews(profileId),
    SFCBackend.getPracticeHistory(profileId, 10)
  ]);

  studyReviews = reviews || [];
  practiceHistory = (attempts || []).map((attempt) => ({
    ...attempt,
    correct_answers: Number(attempt.correct_answers || 0),
    percentage: Number(attempt.percentage || 0),
    total_questions: Number(attempt.total_questions || 0),
    duration_seconds: Number(attempt.duration_seconds || 0)
  }));
}

async function selectUser(name) {
  if (!backendReady) return;

  const profile = profiles.find((item) => item.name === name);
  if (!profile) return;

  const userChanged = selectedUser && selectedUser !== name;

  selectedUser = name;
  sessionStorage.setItem("sfcCurrentUser", name);
  setUserUi(name);

  if (userChanged) {
    practiceSession = null;
    mockSession = null;
    stopMockTimer();
    resetCardState();
  }

  closeUserModal();
  renderLoading("Loading your progress…");

  try {
    await loadLearnerData(profile.id);
    renderCurrentView();
  } catch (error) {
    renderError(error);
  }
}

function changeView(view) {
  const copy = viewCopy[view];
  if (!copy) return;

  if (activeView === "mock" && view !== "mock") {
    stopMockTimer();
  }

  activeView = view;

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });

  viewTitle.textContent = copy.title;
  viewDescription.textContent = copy.description;

  renderCurrentView();
}

function renderLoading(message = "Loading…") {
  workspace.innerHTML = `
    <div class="placeholder-card">
      <span class="placeholder-icon">↻</span>
      <div>
        <span class="section-kicker">Syncing</span>
        <h2>${message}</h2>
        <p>Your study data is being loaded from the shared database.</p>
      </div>
    </div>
  `;
}

function renderError(error) {
  workspace.innerHTML = `
    <div class="placeholder-card sync-error">
      <span class="placeholder-icon">!</span>
      <div>
        <span class="section-kicker">Connection issue</span>
        <h2>We couldn't sync your study data.</h2>
        <p>${error?.message || "Please refresh and try again."}</p>
      </div>
    </div>
  `;
}

function renderCurrentView() {
  if (!backendReady) {
    renderLoading();
    return;
  }

  if (activeView === "study") {
    renderStudy();
    return;
  }

  if (activeView === "practice") {
    renderPractice();
    return;
  }

  if (activeView === "mock") {
    renderMock();
    return;
  }

  if (activeView === "dashboard") {
    renderDashboard();
    return;
  }

  renderComingSoon(activeView);
}

function renderComingSoon(view) {
  const labels = {};

  const [title, copy] = labels[view] || ["Coming soon", "This section is still being prepared."];

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
  return ["All topics", ...new Set(
    QUESTION_BANK.filter((item) => item.studyEnabled).map((item) => item.category)
  )];
}

function getStudyStats() {
  const correct = studyReviews.filter((item) => item.was_correct).length;
  const incorrect = studyReviews.length - correct;

  return {
    correct,
    incorrect,
    accuracy: studyReviews.length ? Math.round((correct / studyReviews.length) * 100) : 0
  };
}

async function saveStudyResult(questionId, wasCorrect) {
  const profile = currentProfile();
  if (!profile) return;

  const rows = await SFCBackend.saveStudyReview(profile.id, questionId, wasCorrect);
  const saved = rows?.[0] || {
    question_id: questionId,
    was_correct: wasCorrect,
    reviewed_at: new Date().toISOString()
  };

  studyReviews.unshift(saved);
  dashboardData = null;
}

function renderStudy() {
  const studyQuestions = QUESTION_BANK.filter((item) => item.studyEnabled);

  if (!filteredQuestions.length) {
    filteredQuestions = [...studyQuestions];
  }

  const question = filteredQuestions[currentQuestionIndex] || filteredQuestions[0];
  if (!question) {
    renderError(new Error("No study questions are available."));
    return;
  }

  const stats = getStudyStats();

  workspace.innerHTML = `
    <div class="study-toolbar">
      <div>
        <span class="section-kicker">Study mode</span>
        <h2>Interactive flashcards</h2>
        <p>Choose an answer, reveal the explanation, then record how you did.</p>
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
      <div><strong>${stats.accuracy}%</strong><span>Accuracy</span></div>
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

      <div class="answer-options">
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
        <small>${question.sbok}</small>
      </div>

      <div class="inline-error" id="study-error" hidden></div>

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

    <p class="study-note">Study progress is synced to your learner profile and will feed the Dashboard.</p>
  `;

  bindStudyEvents(question, studyQuestions);
}

function bindStudyEvents(question, studyQuestions) {
  const optionButtons = document.querySelectorAll(".answer-option");
  const revealButton = document.querySelector("#reveal-answer");
  const correctButton = document.querySelector("#mark-correct");
  const wrongButton = document.querySelector("#mark-wrong");
  const previousButton = document.querySelector("#previous-card");
  const nextButton = document.querySelector("#next-card");
  const filter = document.querySelector("#category-filter");
  const shuffleButton = document.querySelector("#shuffle-study");
  const errorBox = document.querySelector("#study-error");

  optionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (answerRevealed) return;

      selectedAnswer = Number(button.dataset.answer);
      optionButtons.forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  revealButton.addEventListener("click", async () => {
    revealButton.disabled = true;
    revealButton.textContent = "Loading…";
    errorBox.hidden = true;

    try {
      const feedback = await SFCBackend.getStudyFeedback(question.id);

      if (!feedback) {
        throw new Error("No feedback is available for this question.");
      }

      const correctAnswer = Number(feedback.correct_answer);
      answerRevealed = true;

      optionButtons.forEach((button) => {
        const optionIndex = Number(button.dataset.answer);

        if (optionIndex === correctAnswer) button.classList.add("correct");
        if (selectedAnswer === optionIndex && optionIndex !== correctAnswer) {
          button.classList.add("incorrect");
        }

        button.disabled = true;
      });

      document.querySelector("#correct-answer-text").textContent =
        `${String.fromCharCode(65 + correctAnswer)}. ${question.options[correctAnswer]}`;

      document.querySelector("#answer-copy").textContent = feedback.explanation;
      document.querySelector("#answer-explanation").hidden = false;

      revealButton.hidden = true;
      correctButton.hidden = false;
      wrongButton.hidden = false;
    } catch (error) {
      revealButton.disabled = false;
      revealButton.textContent = "Reveal answer";
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    }
  });

  async function recordAndContinue(wasCorrect, button) {
    correctButton.disabled = true;
    wrongButton.disabled = true;
    button.textContent = "Saving…";

    try {
      await saveStudyResult(question.id, wasCorrect);
      goToNextCard();
    } catch (error) {
      correctButton.disabled = false;
      wrongButton.disabled = false;
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      correctButton.textContent = "I got it right";
      wrongButton.textContent = "I got it wrong";
    }
  }

  correctButton.addEventListener("click", () => recordAndContinue(true, correctButton));
  wrongButton.addEventListener("click", () => recordAndContinue(false, wrongButton));

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
      ? [...studyQuestions]
      : studyQuestions.filter((item) => item.category === currentCategory);

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
  const pool = QUESTION_BANK.filter((item) => item.practiceEnabled);
  const safeCount = Math.min(questionCount, pool.length);

  practiceSession = {
    questions: shuffleArray(pool).slice(0, safeCount),
    answers: {},
    currentIndex: 0,
    attemptId: null,
    completed: false,
    result: null,
    error: null
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
  const recentAttempts = practiceHistory.slice(0, 3);

  workspace.innerHTML = `
    <div class="practice-intro">
      <div>
        <span class="section-kicker">Practice mode</span>
        <h2>Choose your session length</h2>
        <p>Answers stay hidden until the end. Your result and history are synced to your learner profile.</p>
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
            <span class="section-kicker">Synced history</span>
            <h3>Recent practice sessions</h3>
          </div>
        </div>

        <div class="recent-attempt-list">
          ${recentAttempts.map((attempt) => `
            <div class="recent-attempt-row">
              <div>
                <strong>${attempt.percentage}%</strong>
                <span>${attempt.correct_answers}/${attempt.total_questions} correct</span>
              </div>
              <div>
                <strong>${new Date(attempt.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong>
                <span>${attempt.total_questions}-question practice</span>
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

      ${session.error ? `<div class="inline-error">${session.error}</div>` : ""}

      <div class="practice-navigation">
        <button class="button button-ghost" id="practice-previous" type="button" ${session.currentIndex === 0 ? "disabled" : ""}>← Previous</button>
        <span class="practice-no-feedback">Answers are reviewed after submission.</span>
        <button
          class="button ${isLastQuestion ? "button-primary" : "button-secondary"}"
          id="${isLastQuestion ? "finish-practice" : "practice-next"}"
          type="button"
          ${currentSelection === undefined ? "disabled" : ""}
        >${isLastQuestion ? "Finish practice" : "Next →"}</button>
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
  document.querySelectorAll("[data-practice-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      practiceSession.answers[question.id] = Number(button.dataset.practiceAnswer);
      practiceSession.error = null;
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

  document.querySelector("#finish-practice")?.addEventListener("click", finishPractice);

  document.querySelectorAll("[data-practice-question]").forEach((button) => {
    button.addEventListener("click", () => {
      practiceSession.currentIndex = Number(button.dataset.practiceQuestion);
      renderPracticeQuestion();
    });
  });
}

async function finishPractice() {
  const session = practiceSession;
  const allAnswered = session.questions.every(
    (item) => session.answers[item.id] !== undefined
  );

  if (!allAnswered) {
    session.error = "Please answer every question before submitting.";
    renderPracticeQuestion();
    return;
  }

  const finishButton = document.querySelector("#finish-practice");
  if (finishButton) {
    finishButton.disabled = true;
    finishButton.textContent = "Submitting…";
  }

  session.error = null;

  try {
    const profile = currentProfile();
    if (!profile) throw new Error("Learner profile not found.");

    const questionIds = session.questions.map((item) => item.id);

    if (!session.attemptId) {
      const attempt = await SFCBackend.createPracticeAttempt(profile.id, questionIds);
      if (!attempt?.id) throw new Error("Could not create the practice attempt.");
      session.attemptId = attempt.id;
    }

    const answers = session.questions.map((item) => ({
      questionId: item.id,
      selectedAnswer: session.answers[item.id]
    }));

    try {
      await SFCBackend.submitPracticeAnswers(session.attemptId, answers);
    } catch (submitError) {
      const existingAttempt = await SFCBackend.getAttempt(session.attemptId);
      if (!existingAttempt?.completed_at) throw submitError;
    }

    const [savedAttempt, review] = await Promise.all([
      SFCBackend.getAttempt(session.attemptId),
      SFCBackend.getPracticeReview(session.attemptId)
    ]);

    if (!savedAttempt?.completed_at) {
      throw new Error("The practice result has not finished processing.");
    }

    const result = {
      id: savedAttempt.id,
      total: Number(savedAttempt.total_questions),
      correct: Number(savedAttempt.correct_answers),
      incorrect: Number(savedAttempt.total_questions) - Number(savedAttempt.correct_answers),
      percentage: Number(savedAttempt.percentage),
      durationSeconds: Number(savedAttempt.duration_seconds || 0),
      completedAt: savedAttempt.completed_at,
      answers: (review || []).map((row) => ({
        questionId: row.question_id,
        selectedAnswer: Number(row.selected_answer),
        correctAnswer: Number(row.correct_answer),
        isCorrect: row.is_correct,
        explanation: row.explanation
      }))
    };

    session.completed = true;
    session.result = result;

    practiceHistory.unshift({
      id: result.id,
      mode: "practice",
      completed_at: result.completedAt,
      total_questions: result.total,
      correct_answers: result.correct,
      percentage: result.percentage,
      duration_seconds: result.durationSeconds
    });

    dashboardData = null;
    renderPracticeResults();
  } catch (error) {
    session.error = error.message;
    renderPracticeQuestion();
  }
}

function getCategoryBreakdown(result) {
  const breakdown = {};

  result.answers.forEach((answer) => {
    const question = QUESTION_BANK.find((item) => item.id === answer.questionId);
    const category = question?.category || "Other";

    if (!breakdown[category]) {
      breakdown[category] = { correct: 0, total: 0 };
    }

    breakdown[category].total += 1;
    if (answer.isCorrect) breakdown[category].correct += 1;
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
          <span>Your result has been saved to your learner profile.</span>
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
                    <strong>${String.fromCharCode(65 + answer.correctAnswer)}. ${question.options[answer.correctAnswer]}</strong>
                  </div>

                  <p>${answer.explanation}</p>
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



function mockStorageKey(profileId) {
  return `sfcActiveMock:${profileId}`;
}

function stopMockTimer() {
  if (mockTimerId) {
    window.clearInterval(mockTimerId);
    mockTimerId = null;
  }
}

function persistMockSession() {
  const profile = currentProfile();
  if (!profile || !mockSession || mockSession.completed) return;

  const safeSession = {
    attemptId: mockSession.attemptId,
    startedAt: mockSession.startedAt,
    durationSeconds: mockSession.durationSeconds,
    passingCorrect: mockSession.passingCorrect,
    questions: mockSession.questions,
    answers: mockSession.answers,
    currentIndex: mockSession.currentIndex
  };

  localStorage.setItem(mockStorageKey(profile.id), JSON.stringify(safeSession));
}

function clearStoredMockSession() {
  const profile = currentProfile();
  if (!profile) return;
  localStorage.removeItem(mockStorageKey(profile.id));
}

function restoreMockSession() {
  const profile = currentProfile();
  if (!profile) return null;

  try {
    const raw = localStorage.getItem(mockStorageKey(profile.id));
    if (!raw) return null;

    const stored = JSON.parse(raw);
    if (!stored?.attemptId || !Array.isArray(stored.questions) || stored.questions.length !== 40) {
      localStorage.removeItem(mockStorageKey(profile.id));
      return null;
    }

    return {
      ...stored,
      answers: stored.answers || {},
      currentIndex: Number(stored.currentIndex || 0),
      completed: false,
      result: null,
      submitting: false,
      error: null
    };
  } catch {
    localStorage.removeItem(mockStorageKey(profile.id));
    return null;
  }
}

function mockSecondsRemaining() {
  if (!mockSession) return 0;

  const deadline = new Date(mockSession.startedAt).getTime() + (mockSession.durationSeconds * 1000);
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function formatMockTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function updateMockTimerDisplay() {
  if (!mockSession || mockSession.completed) return;

  const timer = document.querySelector("#mock-timer");
  const seconds = mockSecondsRemaining();

  if (timer) {
    timer.textContent = formatMockTime(seconds);
    timer.classList.toggle("warning", seconds <= 300);
  }

  if (seconds <= 0 && !mockSession.submitting) {
    stopMockTimer();
    submitMockExam(true);
  }
}

function startMockTimer() {
  stopMockTimer();
  updateMockTimerDisplay();

  if (!mockSession || mockSession.completed || mockSession.submitting) return;

  mockTimerId = window.setInterval(updateMockTimerDisplay, 1000);
}

async function startMockExam() {
  const profile = currentProfile();
  if (!profile) return;

  workspace.innerHTML = `
    <div class="dashboard-loading">
      <span>↻</span>
      <strong>Preparing your 40-question exam…</strong>
    </div>
  `;

  try {
    const rawPayload = await SFCBackend.startMockAttempt(profile.id);
    const payload = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;

    if (!payload?.attempt_id || !Array.isArray(payload.questions) || payload.questions.length !== 40) {
      throw new Error("The Mock Exam could not be prepared.");
    }

    mockSession = {
      attemptId: payload.attempt_id,
      startedAt: payload.started_at,
      durationSeconds: Number(payload.duration_seconds || 3600),
      passingCorrect: Number(payload.passing_correct || 30),
      questions: payload.questions.map((question) => ({
        id: question.id,
        question: question.question_text,
        options: Array.isArray(question.options) ? question.options : [],
        difficulty: question.difficulty,
        category: question.category,
        topic: question.topic,
        subtopic: question.subtopic || ""
      })),
      answers: {},
      currentIndex: 0,
      completed: false,
      result: null,
      submitting: false,
      error: null
    };

    persistMockSession();
    renderMockQuestion();
  } catch (error) {
    renderError(error);
  }
}

function renderMock() {
  if (!mockSession) {
    mockSession = restoreMockSession();
  }

  if (!mockSession) {
    renderMockSetup();
    return;
  }

  if (mockSession.completed) {
    renderMockResults();
    return;
  }

  renderMockQuestion();
}

function renderMockSetup() {
  stopMockTimer();

  workspace.innerHTML = `
    <section class="mock-setup">
      <div class="mock-setup-main">
        <span class="section-kicker">Mock Exam</span>
        <h2>Simulate the SFC™ exam</h2>
        <p>This simulator uses original study questions and follows the current official SFC™ exam format.</p>

        <div class="mock-rules">
          <div><strong>40</strong><span>Questions</span></div>
          <div><strong>60 min</strong><span>Time limit</span></div>
          <div><strong>30 / 40</strong><span>Passing score</span></div>
          <div><strong>No</strong><span>Negative marking</span></div>
        </div>

        <div class="mock-guidance">
          <strong>Before you start</strong>
          <span>The timer starts immediately. Answers are not revealed until you submit. Unanswered questions count as incorrect.</span>
        </div>

        <button class="button button-primary mock-start-button" id="start-mock" type="button">Start Mock Exam</button>
      </div>

      <aside class="mock-security-card">
        <span class="section-kicker">Exam mode</span>
        <h3>Separate question pool</h3>
        <p>Mock-only questions are kept out of Study and Practice, and answer keys are unavailable until the exam is complete.</p>
        <small>Internal difficulty mix: 10 Easy · 20 Medium · 10 Hard</small>
      </aside>
    </section>
  `;

  document.querySelector("#start-mock").addEventListener("click", startMockExam);
}

function renderMockQuestion() {
  const session = mockSession;
  const question = session.questions[session.currentIndex];
  const selected = session.answers[question.id];
  const answeredCount = Object.keys(session.answers).length;
  const unansweredCount = session.questions.length - answeredCount;

  workspace.innerHTML = `
    <div class="mock-exam-header">
      <div>
        <span class="section-kicker">Mock Exam in progress</span>
        <h2>Question ${session.currentIndex + 1} of 40</h2>
      </div>

      <div class="mock-live-stats">
        <div><strong>${answeredCount}</strong><span>Answered</span></div>
        <div><strong>${unansweredCount}</strong><span>Unanswered</span></div>
        <div class="mock-timer-box">
          <strong id="mock-timer">${formatMockTime(mockSecondsRemaining())}</strong>
          <span>Time left</span>
        </div>
      </div>
    </div>

    <div class="study-progress">
      <div style="width:${((session.currentIndex + 1) / 40) * 100}%"></div>
    </div>

    <article class="flashcard mock-card">
      <div class="flashcard-meta">
        <div>
          <span class="topic-pill">${question.category}</span>
          <span class="topic-name">${question.topic}</span>
        </div>
        <span>${question.difficulty}</span>
      </div>

      <h3 class="flashcard-question">${question.question}</h3>

      <div class="answer-options">
        ${question.options.map((option, index) => `
          <button
            class="answer-option ${selected === index ? "selected" : ""}"
            type="button"
            data-mock-answer="${index}"
            ${session.submitting ? "disabled" : ""}
          >
            <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
            <span>${option}</span>
          </button>
        `).join("")}
      </div>

      ${session.error ? `<div class="inline-error">${session.error}</div>` : ""}

      <div class="mock-navigation">
        <button class="button button-ghost" id="mock-previous" type="button" ${session.currentIndex === 0 || session.submitting ? "disabled" : ""}>← Previous</button>
        <span class="practice-no-feedback">No answer feedback until submission.</span>
        <button class="button button-secondary" id="mock-next" type="button" ${session.currentIndex === 39 || session.submitting ? "disabled" : ""}>Next →</button>
      </div>
    </article>

    <div class="mock-question-grid" aria-label="Mock exam question navigation">
      ${session.questions.map((item, index) => {
        const isAnswered = Object.prototype.hasOwnProperty.call(session.answers, item.id);
        return `
          <button
            class="practice-dot ${index === session.currentIndex ? "current" : ""} ${isAnswered ? "answered" : ""}"
            type="button"
            data-mock-question="${index}"
            ${session.submitting ? "disabled" : ""}
            aria-label="Go to question ${index + 1}"
          >${index + 1}</button>
        `;
      }).join("")}
    </div>

    <div class="mock-submit-bar">
      <div>
        <strong>${answeredCount} of 40 answered</strong>
        <span>You can submit before time expires. Blank answers are scored as incorrect.</span>
      </div>
      <button class="button button-primary" id="finish-mock" type="button" ${session.submitting ? "disabled" : ""}>
        ${session.submitting ? "Submitting…" : "Finish Exam"}
      </button>
    </div>
  `;

  document.querySelectorAll("[data-mock-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      session.answers[question.id] = Number(button.dataset.mockAnswer);
      session.error = null;
      persistMockSession();
      renderMockQuestion();
    });
  });

  document.querySelector("#mock-previous")?.addEventListener("click", () => {
    session.currentIndex -= 1;
    persistMockSession();
    renderMockQuestion();
  });

  document.querySelector("#mock-next")?.addEventListener("click", () => {
    session.currentIndex += 1;
    persistMockSession();
    renderMockQuestion();
  });

  document.querySelectorAll("[data-mock-question]").forEach((button) => {
    button.addEventListener("click", () => {
      session.currentIndex = Number(button.dataset.mockQuestion);
      persistMockSession();
      renderMockQuestion();
    });
  });

  document.querySelector("#finish-mock")?.addEventListener("click", () => {
    const remaining = 40 - Object.keys(session.answers).length;
    const message = remaining
      ? `You still have ${remaining} unanswered question${remaining === 1 ? "" : "s"}. Submit anyway?`
      : "Submit your Mock Exam now?";

    if (window.confirm(message)) {
      submitMockExam(false);
    }
  });

  startMockTimer();
}

async function submitMockExam(timedOut = false) {
  if (!mockSession || mockSession.submitting || mockSession.completed) return;

  stopMockTimer();
  mockSession.submitting = true;
  mockSession.error = null;

  if (activeView === "mock") {
    renderMockQuestion();
  }

  const answers = mockSession.questions.map((question) => ({
    questionId: question.id,
    selectedAnswer: Object.prototype.hasOwnProperty.call(mockSession.answers, question.id)
      ? mockSession.answers[question.id]
      : null
  }));

  try {
    try {
      await SFCBackend.submitMockAnswers(mockSession.attemptId, answers);
    } catch (submitError) {
      const existing = await SFCBackend.getAttempt(mockSession.attemptId);
      if (!existing?.completed_at) throw submitError;
    }

    const [savedAttempt, review] = await Promise.all([
      SFCBackend.getAttempt(mockSession.attemptId),
      SFCBackend.getMockReview(mockSession.attemptId)
    ]);

    if (!savedAttempt?.completed_at || !Array.isArray(review) || review.length !== 40) {
      throw new Error("The Mock Exam result has not finished processing.");
    }

    const correct = Number(savedAttempt.correct_answers || 0);
    const total = Number(savedAttempt.total_questions || 40);

    mockSession.result = {
      id: savedAttempt.id,
      correct,
      incorrect: total - correct,
      total,
      percentage: Number(savedAttempt.percentage || 0),
      durationSeconds: Number(savedAttempt.duration_seconds || 0),
      completedAt: savedAttempt.completed_at,
      passed: correct >= mockSession.passingCorrect,
      passingCorrect: mockSession.passingCorrect,
      timedOut,
      answers: review.map((row) => ({
        questionId: row.question_id,
        selectedAnswer: row.selected_answer === null ? null : Number(row.selected_answer),
        correctAnswer: Number(row.correct_answer),
        isCorrect: row.is_correct,
        explanation: row.explanation
      }))
    };

    mockSession.completed = true;
    mockSession.submitting = false;
    clearStoredMockSession();
    dashboardData = null;

    renderMockResults();
  } catch (error) {
    mockSession.submitting = false;
    mockSession.error = error.message;
    persistMockSession();

    if (activeView === "mock") {
      renderMockQuestion();
    }
  }
}

function getMockCategoryBreakdown(result) {
  const questionMap = new Map(mockSession.questions.map((question) => [question.id, question]));
  const categories = {};

  result.answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;

    if (!categories[question.category]) {
      categories[question.category] = { correct: 0, total: 0 };
    }

    categories[question.category].total += 1;
    if (answer.isCorrect) categories[question.category].correct += 1;
  });

  return Object.entries(categories)
    .map(([category, values]) => ({
      category,
      ...values,
      percentage: Math.round((values.correct / values.total) * 100)
    }))
    .sort((a, b) => a.percentage - b.percentage);
}

function renderMockResults() {
  stopMockTimer();

  const result = mockSession.result;
  const questionMap = new Map(mockSession.questions.map((question) => [question.id, question]));
  const breakdown = getMockCategoryBreakdown(result);
  const missed = result.answers.filter((answer) => !answer.isCorrect);

  workspace.innerHTML = `
    <section class="mock-results">
      <div class="result-hero mock-result-hero">
        <div>
          <span class="section-kicker">Mock Exam complete</span>
          <h2>${result.correct}/40</h2>
          <p>${Math.round(result.percentage)}% · ${formatDuration(result.durationSeconds)}${result.timedOut ? " · Time expired" : ""}</p>
        </div>

        <div class="mock-pass-card ${result.passed ? "passed" : "not-passed"}">
          <span>${result.passed ? "PASS" : "NOT PASSED"}</span>
          <strong>${result.passed ? "You reached the official passing threshold." : "You need 30 correct answers to reach the passing threshold."}</strong>
          <small>Passing threshold: ${result.passingCorrect}/40 (75%)</small>
        </div>
      </div>

      <div class="result-summary-grid">
        <div><strong>${result.correct}</strong><span>Correct</span></div>
        <div><strong>${result.incorrect}</strong><span>Incorrect / blank</span></div>
        <div><strong>${Math.round(result.percentage)}%</strong><span>Score</span></div>
        <div><strong>${formatDuration(result.durationSeconds)}</strong><span>Duration</span></div>
      </div>

      <section class="result-section">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Exam breakdown</span>
            <h3>Performance by category</h3>
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
            <h3>${missed.length ? "Incorrect and unanswered questions" : "Perfect score"}</h3>
          </div>
        </div>

        ${missed.length ? `
          <div class="mistake-list">
            ${missed.map((answer) => {
              const question = questionMap.get(answer.questionId);
              const userAnswer = answer.selectedAnswer === null
                ? "Unanswered"
                : `${String.fromCharCode(65 + answer.selectedAnswer)}. ${question.options[answer.selectedAnswer]}`;

              return `
                <article class="mistake-card">
                  <div class="flashcard-meta">
                    <div>
                      <span class="topic-pill">${question.category}</span>
                      <span class="topic-name">${question.topic}</span>
                    </div>
                    <span>${question.difficulty}</span>
                  </div>

                  <h4>${question.question}</h4>

                  <div class="mistake-answer wrong-line">
                    <span>Your answer</span>
                    <strong>${userAnswer}</strong>
                  </div>

                  <div class="mistake-answer correct-line">
                    <span>Correct answer</span>
                    <strong>${String.fromCharCode(65 + answer.correctAnswer)}. ${question.options[answer.correctAnswer]}</strong>
                  </div>

                  <p>${answer.explanation}</p>
                </article>
              `;
            }).join("")}
          </div>
        ` : `
          <div class="perfect-result">
            <strong>Excellent work.</strong>
            <span>You answered all 40 Mock Exam questions correctly.</span>
          </div>
        `}
      </section>

      <div class="result-actions">
        <button class="button button-primary" id="new-mock" type="button">Take another Mock Exam</button>
        <button class="button button-secondary" id="mock-dashboard" type="button">View Dashboard</button>
      </div>

      <p class="study-note">This is an original practice simulator and not the official SCRUMstudy examination.</p>
    </section>
  `;

  document.querySelector("#new-mock").addEventListener("click", () => {
    mockSession = null;
    renderMockSetup();
  });

  document.querySelector("#mock-dashboard").addEventListener("click", () => {
    mockSession = null;
    changeView("dashboard");
  });
}

function dashboardAverage(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function dashboardPercent(value) {
  return value === null || Number.isNaN(value) ? "—" : `${Math.round(value)}%`;
}

function dashboardDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function getProfileAnalytics(profile) {
  const attempts = (dashboardData?.attempts || [])
    .filter((attempt) => attempt.profile_id === profile.id)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  const attemptIds = new Set(attempts.map((attempt) => attempt.id));
  const answers = (dashboardData?.answers || []).filter((answer) => attemptIds.has(answer.attempt_id));
  const reviews = (dashboardData?.reviews || []).filter((review) => review.profile_id === profile.id);

  const averageScore = dashboardAverage(attempts.map((attempt) => attempt.percentage));
  const bestScore = attempts.length ? Math.max(...attempts.map((attempt) => attempt.percentage)) : null;
  const recentFive = dashboardAverage(attempts.slice(-5).map((attempt) => attempt.percentage));

  let improvement = null;
  if (attempts.length >= 4) {
    const firstTwo = dashboardAverage(attempts.slice(0, 2).map((attempt) => attempt.percentage));
    const lastTwo = dashboardAverage(attempts.slice(-2).map((attempt) => attempt.percentage));
    improvement = Math.round(lastTwo - firstTwo);
  }

  const questionLookup = new Map(QUESTION_BANK.map((question) => [question.id, question]));
  const categoryMap = new Map();
  const missMap = new Map();

  answers.forEach((answer) => {
    const question = questionLookup.get(answer.question_id);
    if (!question) return;

    const current = categoryMap.get(question.category) || { category: question.category, correct: 0, total: 0 };
    current.total += 1;
    if (answer.is_correct) current.correct += 1;
    categoryMap.set(question.category, current);

    if (!answer.is_correct) {
      missMap.set(question.id, (missMap.get(question.id) || 0) + 1);
    }
  });

  const categories = [...categoryMap.values()]
    .map((item) => ({
      ...item,
      percentage: Math.round((item.correct / item.total) * 100)
    }))
    .sort((a, b) => a.percentage - b.percentage);

  const reliableCategories = categories.filter((item) => item.total >= 3);
  const weakest = reliableCategories.length ? reliableCategories[0] : null;
  const strongest = reliableCategories.length
    ? [...reliableCategories].sort((a, b) => b.percentage - a.percentage)[0]
    : null;

  const missedQuestions = [...missMap.entries()]
    .map(([questionId, misses]) => ({
      question: questionLookup.get(questionId),
      misses
    }))
    .filter((item) => item.question)
    .sort((a, b) => b.misses - a.misses || a.question.question.localeCompare(b.question.question))
    .slice(0, 5);

  const studyCorrect = reviews.filter((review) => review.was_correct).length;
  const studyAccuracy = reviews.length ? Math.round((studyCorrect / reviews.length) * 100) : null;

  return {
    profile,
    attempts,
    answers,
    reviews,
    averageScore,
    bestScore,
    recentFive,
    improvement,
    categories,
    weakest,
    strongest,
    missedQuestions,
    studyAccuracy
  };
}

function renderDashboardTabs() {
  return `
    <div class="dashboard-actions">
      <div class="dashboard-tabs" role="tablist" aria-label="Dashboard view">
        <button class="${dashboardMode === "personal" ? "active" : ""}" type="button" data-dashboard-mode="personal">Personal</button>
        <button class="${dashboardMode === "compare" ? "active" : ""}" type="button" data-dashboard-mode="compare">Compare</button>
      </div>
      <button class="button button-secondary dashboard-refresh" id="dashboard-refresh" type="button">Refresh</button>
    </div>
  `;
}

function bindDashboardControls() {
  document.querySelectorAll("[data-dashboard-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      dashboardMode = button.dataset.dashboardMode;
      renderDashboard();
    });
  });

  document.querySelector("#dashboard-refresh")?.addEventListener("click", () => {
    dashboardData = null;
    renderDashboard();
  });
}

function renderScoreHistory(attempts) {
  if (!attempts.length) {
    return `
      <div class="dashboard-empty compact">
        <strong>No practice history yet</strong>
        <span>Complete a Practice session to start the score trend.</span>
      </div>
    `;
  }

  const recent = attempts.slice(-8);

  return `
    <div class="score-history" aria-label="Recent practice scores">
      ${recent.map((attempt) => `
        <div class="score-bar-item">
          <div class="score-bar-track">
            <div class="score-bar-fill" style="height:${Math.max(4, attempt.percentage)}%"></div>
          </div>
          <strong>${Math.round(attempt.percentage)}%</strong>
          <span>${dashboardDate(attempt.completed_at)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderTopicPerformance(categories) {
  if (!categories.length) {
    return `
      <div class="dashboard-empty compact">
        <strong>No topic data yet</strong>
        <span>Topic accuracy appears after completed Practice answers.</span>
      </div>
    `;
  }

  return `
    <div class="dashboard-topic-list">
      ${categories.map((item) => `
        <div class="dashboard-topic-row">
          <div>
            <strong>${item.category}</strong>
            <span>${item.correct}/${item.total} correct</span>
          </div>
          <div class="dashboard-topic-score">
            <strong>${item.percentage}%</strong>
            <div><i style="width:${item.percentage}%"></i></div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderMissedQuestions(items) {
  if (!items.length) {
    return `
      <div class="dashboard-empty compact">
        <strong>No repeated misses yet</strong>
        <span>Questions answered incorrectly in Practice will appear here.</span>
      </div>
    `;
  }

  return `
    <div class="dashboard-missed-list">
      ${items.map((item) => `
        <div class="dashboard-missed-row">
          <div>
            <span class="topic-pill">${item.question.category}</span>
            <strong>${item.question.question}</strong>
          </div>
          <span class="miss-count">${item.misses} miss${item.misses === 1 ? "" : "es"}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderRecentAttempts(attempts) {
  if (!attempts.length) {
    return `
      <div class="dashboard-empty compact">
        <strong>No completed Practice sessions</strong>
        <span>Your latest attempts will appear here.</span>
      </div>
    `;
  }

  return `
    <div class="dashboard-attempt-list">
      ${[...attempts].reverse().slice(0, 5).map((attempt) => `
        <div class="dashboard-attempt-row">
          <div>
            <strong>${Math.round(attempt.percentage)}%</strong>
            <span>${attempt.correct_answers}/${attempt.total_questions} correct</span>
          </div>
          <div>
            <strong>${dashboardDate(attempt.completed_at)}</strong>
            <span>${attempt.mode === "mock" ? "Mock Exam" : "Practice"}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPersonalDashboard() {
  const profile = currentProfile();
  if (!profile) return;

  const data = getProfileAnalytics(profile);
  const trendCopy = data.improvement === null
    ? "Need 4 attempts"
    : `${data.improvement > 0 ? "+" : ""}${data.improvement} pts`;

  workspace.innerHTML = `
    <div class="dashboard-toolbar">
      <div>
        <span class="section-kicker">Dashboard</span>
        <h2>${profile.name}'s progress</h2>
        <p>Synced Study and Practice activity. Topic conclusions require at least three answers in that category.</p>
      </div>
      ${renderDashboardTabs()}
    </div>

    <div class="dashboard-metric-grid">
      <article><span>Average score</span><strong>${dashboardPercent(data.averageScore)}</strong><small>Completed scored sessions</small></article>
      <article><span>Best score</span><strong>${dashboardPercent(data.bestScore)}</strong><small>Personal best so far</small></article>
      <article><span>Attempts</span><strong>${data.attempts.length}</strong><small>Completed sessions</small></article>
      <article><span >Scored answers</span><strong>${data.answers.length}</strong><small>Questions submitted</small></article>
    </div>

    <div class="dashboard-insight-grid">
      <article>
        <span>Recent 5 average</span>
        <strong>${dashboardPercent(data.recentFive)}</strong>
        <small>Up to the five latest attempts</small>
      </article>
      <article>
        <span>Study reviews</span>
        <strong>${data.reviews.length}</strong>
        <small>${data.studyAccuracy === null ? "No Study reviews yet" : `${data.studyAccuracy}% self-reported accuracy`}</small>
      </article>
      <article>
        <span>Trend</span>
        <strong>${trendCopy}</strong>
        <small>First two vs. latest two attempts</small>
      </article>
      <article>
        <span>Strong / weak signal</span>
        <strong>${data.strongest ? data.strongest.category : "Need more data"}</strong>
        <small>${data.weakest ? `Review: ${data.weakest.category}` : "3+ answers per category required"}</small>
      </article>
    </div>

    <div class="dashboard-two-column">
      <section class="dashboard-panel">
        <div class="dashboard-panel-heading">
          <div>
            <span class="section-kicker">Score history</span>
            <h3>Recent trend</h3>
          </div>
        </div>
        ${renderScoreHistory(data.attempts)}
      </section>

      <section class="dashboard-panel">
        <div class="dashboard-panel-heading">
          <div>
            <span class="section-kicker">History</span>
            <h3>Recent attempts</h3>
          </div>
        </div>
        ${renderRecentAttempts(data.attempts)}
      </section>
    </div>

    <section class="dashboard-panel">
      <div class="dashboard-panel-heading">
        <div>
          <span class="section-kicker">Topic performance</span>
          <h3>Accuracy by category</h3>
        </div>
        <span class="dashboard-helper">Based on Practice answers</span>
      </div>
      ${renderTopicPerformance(data.categories)}
    </section>

    <section class="dashboard-panel">
      <div class="dashboard-panel-heading">
        <div>
          <span class="section-kicker">Review queue</span>
          <h3>Most-missed questions</h3>
        </div>
      </div>
      ${renderMissedQuestions(data.missedQuestions)}
    </section>
  `;

  bindDashboardControls();
}

function renderCompareDashboard() {
  const analytics = profiles.map((profile) => getProfileAnalytics(profile));
  const categoryNames = [...new Set(
    analytics.flatMap((item) => item.categories.map((category) => category.category))
  )];

  const sharedWeakAreas = categoryNames.filter((categoryName) => {
    const both = analytics.map((person) => person.categories.find((item) => item.category === categoryName));
    return both.every((item) => item && item.total >= 3 && item.percentage < 75);
  });

  workspace.innerHTML = `
    <div class="dashboard-toolbar">
      <div>
        <span class="section-kicker">Dashboard</span>
        <h2>Ayelén & Sam</h2>
        <p>A side-by-side view of synced progress. Missing data stays blank rather than being estimated.</p>
      </div>
      ${renderDashboardTabs()}
    </div>

    <div class="compare-profile-grid">
      ${analytics.map((person) => `
        <article class="compare-profile-card">
          <div class="compare-profile-header">
            <span class="profile-avatar">${person.profile.avatar_initial}</span>
            <div>
              <strong>${person.profile.name}</strong>
              <span>${person.attempts.length} completed attempt${person.attempts.length === 1 ? "" : "s"}</span>
            </div>
          </div>
          <div class="compare-stat-grid">
            <div><span>Average</span><strong>${dashboardPercent(person.averageScore)}</strong></div>
            <div><span>Best</span><strong>${dashboardPercent(person.bestScore)}</strong></div>
            <div><span>Recent 5</span><strong>${dashboardPercent(person.recentFive)}</strong></div>
            <div><span>Answers</span><strong>${person.answers.length}</strong></div>
          </div>
        </article>
      `).join("")}
    </div>

    <section class="dashboard-panel">
      <div class="dashboard-panel-heading">
        <div>
          <span class="section-kicker">Topics</span>
          <h3>Category comparison</h3>
        </div>
        <span class="dashboard-helper">Percentages only appear where answers exist</span>
      </div>

      ${categoryNames.length ? `
        <div class="compare-topic-list">
          ${categoryNames.map((categoryName) => {
            const rows = analytics.map((person) => person.categories.find((item) => item.category === categoryName));
            return `
              <div class="compare-topic-row">
                <strong class="compare-topic-name">${categoryName}</strong>
                ${analytics.map((person, index) => {
                  const item = rows[index];
                  return `
                    <div class="compare-topic-person">
                      <span>${person.profile.name}</span>
                      <strong>${item ? `${item.percentage}%` : "—"}</strong>
                      <small>${item ? `${item.total} answers` : "No data"}</small>
                      <div><i style="width:${item ? item.percentage : 0}%"></i></div>
                    </div>
                  `;
                }).join("")}
              </div>
            `;
          }).join("")}
        </div>
      ` : `
        <div class="dashboard-empty compact">
          <strong>No shared Practice data yet</strong>
          <span>Complete sessions under both profiles to populate the comparison.</span>
        </div>
      `}
    </section>

    <section class="dashboard-panel">
      <div class="dashboard-panel-heading">
        <div>
          <span class="section-kicker">Study together</span>
          <h3>Shared review opportunities</h3>
        </div>
      </div>

      ${sharedWeakAreas.length ? `
        <div class="shared-review-list">
          ${sharedWeakAreas.map((category) => `
            <div>
              <strong>${category}</strong>
              <span>Both learners are currently below 75% with at least three answers in this category.</span>
            </div>
          `).join("")}
        </div>
      ` : `
        <div class="dashboard-empty compact">
          <strong>No shared weak area identified yet</strong>
          <span>This needs at least three Practice answers per learner in the same category.</span>
        </div>
      `}
    </section>
  `;

  bindDashboardControls();
}

async function renderDashboard() {
  if (!dashboardData) {
    workspace.innerHTML = `
      <div class="dashboard-toolbar">
        <div>
          <span class="section-kicker">Dashboard</span>
          <h2>Building your progress view</h2>
          <p>Loading synced attempts, answers, and Study activity.</p>
        </div>
        ${renderDashboardTabs()}
      </div>
      <div class="dashboard-loading">
        <span>↻</span>
        <strong>Loading dashboard data…</strong>
      </div>
    `;

    bindDashboardControls();

    if (dashboardLoading) return;
    dashboardLoading = true;

    try {
      const [attempts, answers, reviews] = await Promise.all([
        SFCBackend.getDashboardAttempts(),
        SFCBackend.getDashboardAnswers(),
        SFCBackend.getDashboardStudyReviews()
      ]);

      dashboardData = {
        attempts: (attempts || []).map((attempt) => ({
          ...attempt,
          total_questions: Number(attempt.total_questions || 0),
          correct_answers: Number(attempt.correct_answers || 0),
          percentage: Number(attempt.percentage || 0),
          duration_seconds: Number(attempt.duration_seconds || 0)
        })),
        answers: answers || [],
        reviews: reviews || []
      };
    } catch (error) {
      renderError(error);
      return;
    } finally {
      dashboardLoading = false;
    }

    if (activeView !== "dashboard") return;
  }

  if (dashboardMode === "compare") {
    renderCompareDashboard();
  } else {
    renderPersonalDashboard();
  }
}

userOptions.forEach((button) => {
  button.disabled = true;
  button.addEventListener("click", () => selectUser(button.dataset.user));
});

currentUserButton.addEventListener("click", openUserModal);

navLinks.forEach((button) => {
  button.addEventListener("click", () => changeView(button.dataset.view));
});

function initMobileNavigationScroll() {
  const mobileQuery = window.matchMedia("(max-width: 640px)");
  let lastScrollY = Math.max(window.scrollY, 0);
  let ticking = false;

  function updateNavigationVisibility() {
    const currentScrollY = Math.max(window.scrollY, 0);

    if (!mobileQuery.matches) {
      appHeader.classList.remove("nav-collapsed");
      lastScrollY = currentScrollY;
      return;
    }

    if (currentScrollY <= 24) {
      appHeader.classList.remove("nav-collapsed");
    } else if (currentScrollY > lastScrollY + 3 && currentScrollY > 96) {
      appHeader.classList.add("nav-collapsed");
    } else if (currentScrollY < lastScrollY - 3) {
      appHeader.classList.remove("nav-collapsed");
    }

    lastScrollY = currentScrollY;
  }

  window.addEventListener("scroll", () => {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(() => {
      updateNavigationVisibility();
      ticking = false;
    });
  }, { passive: true });

  mobileQuery.addEventListener?.("change", updateNavigationVisibility);
  updateNavigationVisibility();
}

async function initializeApp() {
  openUserModal();
  renderLoading("Connecting to your study database…");

  try {
    const [profileRows, questionRows] = await Promise.all([
      SFCBackend.getProfiles(),
      SFCBackend.getQuestions()
    ]);

    profiles = profileRows || [];
    QUESTION_BANK = (questionRows || []).map(normalizeQuestion);
    filteredQuestions = QUESTION_BANK.filter((item) => item.studyEnabled);

    if (profiles.length !== 2 || !QUESTION_BANK.length) {
      throw new Error("The study database is missing required profiles or questions.");
    }

    backendReady = true;
    syncStatus.textContent = "Progress is synced across devices.";
    modalNote.textContent = "Choose a learner to load synced progress.";

    userOptions.forEach((button) => {
      button.disabled = false;
    });

    const sessionUser = sessionStorage.getItem("sfcCurrentUser");
    if (sessionUser && profiles.some((profile) => profile.name === sessionUser)) {
      selectedUser = sessionUser;
      setUserUi(sessionUser);
    }

    renderCurrentView();
  } catch (error) {
    syncStatus.textContent = "Sync unavailable.";
    modalNote.textContent = error.message;
    renderError(error);
  }
}

initMobileNavigationScroll();
initializeApp();
