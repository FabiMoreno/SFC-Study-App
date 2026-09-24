# SFC Study App

A lightweight web app for Ayelén and Sam to prepare for the SCRUMstudy Scrum Fundamentals Certified (SFC™) exam.

## Live app

Netlify: https://sfc-study-app.netlify.app

## Stack

- HTML
- CSS
- Vanilla JavaScript
- Supabase
- Netlify
- GitHub

## Current functionality

### Learner selection
- Ayelén / Sam profile picker
- selected learner always visible
- switch user at any time
- profile data loaded from Supabase

### Study mode
- 120 original American English questions stored in Supabase
- category filter and shuffle
- answer feedback requested from a controlled database function
- SBOK® references
- study reviews saved to Supabase per learner

### Practice mode
- 10- or 20-question randomized sessions
- no answer feedback until submission
- final score computed by database triggers
- performance breakdown by category
- detailed review of missed questions
- practice history saved to Supabase per learner

### Dashboard
- Personal and Ayelén vs Sam comparison views
- average score, best score, attempts, and answer counts
- recent-five average and score trend
- category performance based on real Practice answers
- most-missed questions
- shared review opportunities only when both learners have enough data
- explicit empty states instead of estimated or fabricated metrics

### Question bank
- 120 original questions aligned to SBOK® Fifth Edition chapters 1–12
- 29 easy / 65 medium / 26 hard
- answer positions balanced across A/B/C/D
- separate coverage for Initiate, Plan & Estimate, Implement, Review & Retrospect, and Release
- correct answers and explanations remain private in Supabase

## Security model

- The browser uses a Supabase publishable key only.
- No secret or service-role key is exposed in the repository or Netlify site.
- Public tables use Row Level Security.
- Correct answers and explanations are stored in a non-exposed private table.
- The public app cannot directly update computed scores.
- This MVP has no user authentication, so choosing Ayelén or Sam is a profile selector, not proof of identity.

## Planned next steps

- add Mock Exam with a dedicated non-revealable question pool
- refine Dashboard insights as more real history accumulates
- optionally add lightweight PIN/Auth later

## Supabase entities

- profiles
- topics
- questions
- study_reviews
- exam_attempts
- attempt_answers
- private.question_keys
