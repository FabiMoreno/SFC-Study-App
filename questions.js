const QUESTION_BANK = [
  {
    id: "FND-001",
    category: "Foundations",
    topic: "Scrum Overview",
    question: "What best describes Scrum?",
    options: [
      "A detailed project-management methodology where a project manager assigns tasks.",
      "An adaptive, iterative framework designed to deliver value throughout a project.",
      "A software tool used to manage Agile projects.",
      "A variation of the Waterfall methodology."
    ],
    correctAnswer: 1,
    explanation: "Scrum is adaptive and iterative. It is designed to deliver value incrementally rather than rely on a fully predictive plan.",
    sbok: "SBOK® 5th Ed. — Chapter 1: Introduction"
  },
  {
    id: "FND-002",
    category: "Foundations",
    topic: "Core Roles",
    question: "Which three are core Scrum roles in the SBOK® framework?",
    options: [
      "Project Manager, Business Analyst, Developers",
      "Product Owner, Scrum Master, Scrum Team",
      "Product Manager, Agile Coach, Developers",
      "Sponsor, Project Manager, Scrum Master"
    ],
    correctAnswer: 1,
    explanation: "The three core roles are Product Owner, Scrum Master, and Scrum Team.",
    sbok: "SBOK® 5th Ed. — Chapter 3: Organization"
  },
  {
    id: "FND-003",
    category: "Foundations",
    topic: "Sprint",
    question: "A Sprint is best described as:",
    options: [
      "A project-planning meeting.",
      "A time-boxed iterative development cycle.",
      "A meeting between the Product Owner and customer.",
      "The final stage before releasing a product."
    ],
    correctAnswer: 1,
    explanation: "A Sprint is the time-boxed iteration in which the Scrum Team works to create deliverables. Sprint Planning is a meeting, not the Sprint itself.",
    sbok: "SBOK® 5th Ed. — §2.6 Time-boxing"
  },
  {
    id: "FND-004",
    category: "Foundations",
    topic: "Prioritized Product Backlog",
    question: "What is the primary purpose of the Prioritized Product Backlog?",
    options: [
      "Record employee performance.",
      "Maintain a prioritized list of requirements and User Stories.",
      "Document only completed work.",
      "Replace Sprint Planning."
    ],
    correctAnswer: 1,
    explanation: "The Prioritized Product Backlog contains the prioritized requirements for the product or project.",
    sbok: "SBOK® 5th Ed. — Initiate"
  },
  {
    id: "FND-005",
    category: "Foundations",
    topic: "User Stories",
    question: "Which statement about User Stories is most accurate?",
    options: [
      "They describe requirements from a user or stakeholder perspective.",
      "They are technical tasks written exclusively by developers.",
      "They replace the Product Backlog.",
      "They can only be created during a Sprint."
    ],
    correctAnswer: 0,
    explanation: "User Stories express requirements from the perspective of users or stakeholders and help communicate expected value.",
    sbok: "SBOK® 5th Ed. — Plan and Estimate"
  },
  {
    id: "PRI-001",
    category: "Scrum Principles",
    topic: "Empirical Process Control",
    question: "Which Scrum principle is associated with transparency, inspection, and adaptation?",
    options: [
      "Collaboration",
      "Self-organization",
      "Empirical Process Control",
      "Value-based Prioritization"
    ],
    correctAnswer: 2,
    explanation: "Empirical Process Control is built on Transparency, Inspection, and Adaptation.",
    sbok: "SBOK® 5th Ed. — §2.2 Empirical Process Control"
  },
  {
    id: "PRI-002",
    category: "Scrum Principles",
    topic: "Transparency",
    question: "A Scrum Team makes progress, challenges, and completed work visible so everyone has the same understanding. Which concept is MOST directly demonstrated?",
    options: [
      "Adaptation",
      "Transparency",
      "Value-based Prioritization",
      "Self-organization"
    ],
    correctAnswer: 1,
    explanation: "Making relevant information visible and understandable is Transparency.",
    sbok: "SBOK® 5th Ed. — §2.2.1 Transparency"
  },
  {
    id: "PRI-003",
    category: "Scrum Principles",
    topic: "Inspection",
    question: "A team frequently reviews deliverables to detect undesirable variances as early as possible. Which element of Empirical Process Control is MOST directly represented?",
    options: [
      "Transparency",
      "Inspection",
      "Adaptation",
      "Collaboration"
    ],
    correctAnswer: 1,
    explanation: "Inspection means reviewing results and progress to identify problems or variances.",
    sbok: "SBOK® 5th Ed. — §2.2.2 Inspection"
  },
  {
    id: "PRI-004",
    category: "Scrum Principles",
    topic: "Adaptation",
    question: "After inspecting results, the Scrum Team changes its approach because the current one will not achieve the desired outcome. Which concept is MOST directly demonstrated?",
    options: [
      "Transparency",
      "Inspection",
      "Adaptation",
      "Prioritization"
    ],
    correctAnswer: 2,
    explanation: "Changing the approach in response to what was learned is Adaptation.",
    sbok: "SBOK® 5th Ed. — §2.2.3 Adaptation"
  },
  {
    id: "PRI-005",
    category: "Scrum Principles",
    topic: "Time-boxing",
    question: "A Daily Standup repeatedly lasts 40 minutes because the team tries to solve technical problems during the meeting. Which Scrum principle is MOST directly affected?",
    options: [
      "Collaboration",
      "Value-based Prioritization",
      "Iterative Development",
      "Time-boxing"
    ],
    correctAnswer: 3,
    explanation: "The Daily Standup has a defined time-box. Detailed problem solving should continue separately afterward.",
    sbok: "SBOK® 5th Ed. — §2.6 Time-boxing"
  },
  {
    id: "PRI-006",
    category: "Scrum Principles",
    topic: "Value-based Prioritization",
    question: "The Product Owner has ten requirements but limited budget. Which principle should primarily guide the order in which requirements are addressed?",
    options: [
      "Time-boxing",
      "Self-organization",
      "Value-based Prioritization",
      "Empirical Process Control"
    ],
    correctAnswer: 2,
    explanation: "Value-based Prioritization focuses on doing higher-value work earlier while considering relevant constraints such as risk and dependencies.",
    sbok: "SBOK® 5th Ed. — §2.5 Value-based Prioritization"
  },
  {
    id: "PRI-007",
    category: "Scrum Principles",
    topic: "Collaboration",
    question: "Several Scrum Team members jointly discuss a difficult User Story and combine their expertise to find the best solution. Which principle is MOST directly demonstrated?",
    options: [
      "Collaboration",
      "Time-boxing",
      "Value-based Prioritization",
      "Adaptation"
    ],
    correctAnswer: 0,
    explanation: "The team is using Collaboration by working together and combining knowledge.",
    sbok: "SBOK® 5th Ed. — §2.4 Collaboration"
  },
  {
    id: "PRI-008",
    category: "Scrum Principles",
    topic: "Iterative Development",
    question: "Rather than building an entire complex product in one long cycle, a Scrum project repeatedly produces valuable functionality in shorter cycles. Which principle BEST explains this?",
    options: [
      "Empirical Process Control",
      "Iterative Development",
      "Self-organization",
      "Collaboration"
    ],
    correctAnswer: 1,
    explanation: "Iterative Development breaks complex work into repeated cycles that enable feedback and progressive refinement.",
    sbok: "SBOK® 5th Ed. — §2.7 Iterative Development"
  },
  {
    id: "ROL-001",
    category: "Roles & Organization",
    topic: "Product Owner",
    question: "Who is primarily responsible for maximizing business value and prioritizing the Prioritized Product Backlog?",
    options: [
      "Scrum Master",
      "Scrum Team",
      "Product Owner",
      "Project Manager"
    ],
    correctAnswer: 2,
    explanation: "The Product Owner represents the business and stakeholder perspective, maximizes value, and prioritizes requirements.",
    sbok: "SBOK® 5th Ed. — §3.3 Product Owner"
  },
  {
    id: "ROL-002",
    category: "Roles & Organization",
    topic: "Scrum Master",
    question: "A developer encounters an external impediment that prevents progress. Which role primarily helps facilitate its removal?",
    options: [
      "Product Owner",
      "Scrum Master",
      "Project Sponsor",
      "Customer"
    ],
    correctAnswer: 1,
    explanation: "Removing or facilitating the removal of impediments is a key Scrum Master responsibility.",
    sbok: "SBOK® 5th Ed. — §3.4 Scrum Master"
  },
  {
    id: "ROL-003",
    category: "Roles & Organization",
    topic: "Scrum Team",
    question: "Who decides how the work selected for a Sprint will be performed?",
    options: [
      "Product Owner",
      "Scrum Master",
      "Scrum Team",
      "Project Sponsor"
    ],
    correctAnswer: 2,
    explanation: "The Scrum Team self-organizes and determines how to accomplish the selected work.",
    sbok: "SBOK® 5th Ed. — §2.3 Self-organization / §3.5 Scrum Team"
  },
  {
    id: "ROL-004",
    category: "Roles & Organization",
    topic: "Self-organization",
    question: "One developer is overloaded while another has available capacity. What is MOST consistent with Scrum?",
    options: [
      "Wait for the Scrum Master to reassign tasks.",
      "Escalate to the Project Manager.",
      "The team reorganizes how it performs the work.",
      "Ask the Product Owner to assign developers."
    ],
    correctAnswer: 2,
    explanation: "The Scrum Team self-organizes. The Scrum Master supports the team but does not act as a traditional task allocator.",
    sbok: "SBOK® 5th Ed. — §2.3 Self-organization"
  },
  {
    id: "ROL-005",
    category: "Roles & Organization",
    topic: "Core vs. Non-core Roles",
    question: "Which of these is a non-core role in the SBOK® framework?",
    options: [
      "Product Owner",
      "Scrum Master",
      "Scrum Team",
      "Stakeholder"
    ],
    correctAnswer: 3,
    explanation: "Stakeholder is a non-core role. Product Owner, Scrum Master, and Scrum Team are the three core roles.",
    sbok: "SBOK® 5th Ed. — §3.2 Scrum Project Roles"
  },
  {
    id: "PRO-001",
    category: "Processes & Flow",
    topic: "Five Phases",
    question: "According to SBOK®, which is the correct order of the five Scrum phases?",
    options: [
      "Initiate → Plan and Estimate → Implement → Review and Retrospect → Release",
      "Initiate → Implement → Plan and Estimate → Release → Review and Retrospect",
      "Plan and Estimate → Initiate → Implement → Review and Retrospect → Release",
      "Initiate → Plan and Estimate → Review and Retrospect → Implement → Release"
    ],
    correctAnswer: 0,
    explanation: "The five phases are Initiate, Plan and Estimate, Implement, Review and Retrospect, and Release.",
    sbok: "SBOK® 5th Ed. — Scrum Processes"
  },
  {
    id: "PRO-002",
    category: "Processes & Flow",
    topic: "Initiate",
    question: "During which phase is the Project Vision initially created?",
    options: [
      "Initiate",
      "Plan and Estimate",
      "Implement",
      "Release"
    ],
    correctAnswer: 0,
    explanation: "Create Project Vision is part of the Initiate phase.",
    sbok: "SBOK® 5th Ed. — Initiate"
  },
  {
    id: "PRO-003",
    category: "Processes & Flow",
    topic: "Plan and Estimate",
    question: "The Scrum Team selects User Stories for a Sprint, breaks them into tasks, and estimates those tasks. Which phase is this?",
    options: [
      "Initiate",
      "Plan and Estimate",
      "Implement",
      "Review and Retrospect"
    ],
    correctAnswer: 1,
    explanation: "Selecting Sprint work, identifying tasks, estimating, and creating the Sprint Backlog are part of Plan and Estimate.",
    sbok: "SBOK® 5th Ed. — Plan and Estimate"
  },
  {
    id: "PRO-004",
    category: "Processes & Flow",
    topic: "Implement",
    question: "During a Sprint, the team performs planned work and creates potentially shippable deliverables. Which phase is this?",
    options: [
      "Plan and Estimate",
      "Implement",
      "Review and Retrospect",
      "Release"
    ],
    correctAnswer: 1,
    explanation: "Creating the deliverables during the Sprint occurs in the Implement phase.",
    sbok: "SBOK® 5th Ed. — Implement"
  },
  {
    id: "PRO-005",
    category: "Processes & Flow",
    topic: "Demonstrate and Validate Sprint",
    question: "Stakeholders inspect completed Sprint deliverables and provide feedback. Which process is MOST directly associated with this?",
    options: [
      "Conduct Daily Standup",
      "Groom Prioritized Product Backlog",
      "Demonstrate and Validate Sprint",
      "Ship Deliverables"
    ],
    correctAnswer: 2,
    explanation: "Demonstrate and Validate Sprint focuses on reviewing completed deliverables and obtaining acceptance or feedback.",
    sbok: "SBOK® 5th Ed. — Review and Retrospect"
  },
  {
    id: "PRO-006",
    category: "Processes & Flow",
    topic: "Retrospect Sprint",
    question: "After a Sprint, the team identifies ways to improve its processes and performance. Which process is being performed?",
    options: [
      "Retrospect Sprint",
      "Create User Stories",
      "Commit User Stories",
      "Form Scrum Team"
    ],
    correctAnswer: 0,
    explanation: "Retrospect Sprint focuses on how the team worked and how it can improve in the next Sprint.",
    sbok: "SBOK® 5th Ed. — Review and Retrospect"
  }
];
