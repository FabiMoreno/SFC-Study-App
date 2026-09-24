# SFC Study App

A lightweight web app for Ayelén and Sam to prepare for the SCRUMstudy Scrum Fundamentals Certified (SFC™) exam.

## Stack

- HTML
- CSS
- Vanilla JavaScript
- Supabase (planned persistence)
- Netlify
- GitHub

## Current functionality

### Learner selection
- Ayelén / Sam profile picker
- selected learner always visible
- switch user at any time

### Study mode
- 24 American English questions
- category filter
- shuffle
- answer reveal + explanation
- SBOK® references
- temporary per-user progress in localStorage

### Practice mode
- 10- or 20-question randomized sessions
- no answer feedback until submission
- previous / next navigation
- answered-question navigator
- final percentage and correct/incorrect totals
- performance breakdown by category
- detailed review of missed questions
- recent practice history saved locally per learner

## Planned next steps

- move profiles, questions, attempts, and answers to Supabase
- expand question bank to 100–150 questions
- add 40-question / 60-minute Mock Exam
- build personal and comparison Dashboard
- connect Netlify to this repository for automatic deploys from `main`

## Planned Supabase entities

- profiles
- topics
- questions
- exam_attempts
- attempt_answers

No production credentials or private keys should be committed to this repository.
