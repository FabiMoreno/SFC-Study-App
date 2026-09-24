const USERS = {
  "Ayelén": { initial: "A" },
  "Sam": { initial: "S" }
};

const viewCopy = {
  study: {
    title: "Study smarter for your Scrum Fundamentals exam.",
    description: "Review concepts, practice exam-style questions, and build a clear picture of your progress."
  },
  practice: {
    title: "Practice without the pressure of a full exam.",
    description: "Short randomized question sets will help reinforce concepts and reveal weak areas."
  },
  mock: {
    title: "Simulate the real SFC™ exam experience.",
    description: "The mock exam will use 40 questions, a 60-minute timer, and results at the end."
  },
  dashboard: {
    title: "Turn every answer into useful study insight.",
    description: "Track historical scores, recurring mistakes, topic performance, and compare Ayelén and Sam."
  }
};

const modal = document.querySelector("#user-modal");
const currentUserButton = document.querySelector("#current-user");
const userName = document.querySelector("#user-name");
const userAvatar = document.querySelector("#user-avatar");
const heroUser = document.querySelector("#hero-user");
const viewTitle = document.querySelector("#view-title");
const viewDescription = document.querySelector("#view-description");
const navLinks = document.querySelectorAll(".nav-link");
const userOptions = document.querySelectorAll(".user-option");

let selectedUser = null;

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
}

function changeView(view) {
  const copy = viewCopy[view];
  if (!copy) return;

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });

  viewTitle.textContent = copy.title;
  viewDescription.textContent = copy.description;
}

userOptions.forEach((button) => {
  button.addEventListener("click", () => selectUser(button.dataset.user));
});

currentUserButton.addEventListener("click", openUserModal);

navLinks.forEach((button) => {
  button.addEventListener("click", () => changeView(button.dataset.view));
});

// The learner picker intentionally opens on every new page load.
// The selected user is kept only for the active tab/session so that future
// Supabase results are less likely to be recorded under the wrong learner.
const sessionUser = sessionStorage.getItem("sfcCurrentUser");
if (sessionUser && USERS[sessionUser]) {
  userName.textContent = sessionUser;
  userAvatar.textContent = USERS[sessionUser].initial;
  heroUser.textContent = sessionUser;
}

openUserModal();
