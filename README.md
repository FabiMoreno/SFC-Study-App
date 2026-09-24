# SFC Study App

A lightweight web app for Ayelén and Sam to prepare for the SCRUMstudy Scrum Fundamentals Certified (SFC™) exam.

## MVP

- User selector: Ayelén / Sam
- Current user always visible
- Study flashcards
- Practice mode
- 40-question mock exam
- Historical scores per user
- Topic/subtopic performance
- Most-missed questions
- Ayelén vs Sam comparison
- Supabase-backed question bank and attempt history

## Stack

- HTML
- CSS
- Vanilla JavaScript
- Supabase
- Netlify
- GitHub

## Initial structure

```text
index.html
styles.css
app.js
supabase/
assets/
README.md
```

## Data model planned for Supabase

- profiles
- topics
- questions
- exam_attempts
- attempt_answers

## Deployment

The app will be deployed as a static site on Netlify and connected to this GitHub repository for automatic deploys from `main`.

No production credentials or private keys should be committed to this repository.
