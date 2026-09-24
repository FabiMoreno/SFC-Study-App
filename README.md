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

## Current milestone

Study mode is now functional with a local question bank:

- 24 American English study questions
- category filter
- shuffle
- answer reveal + explanation
- SBOK® references
- temporary per-user progress stored in localStorage

The local bank is temporary. It will be migrated to Supabase once the Study and Practice interactions are validated.

## Planned Supabase entities

- profiles
- topics
- questions
- exam_attempts
- attempt_answers

## Deployment

The app will be deployed as a static site on Netlify and connected to this GitHub repository for automatic deploys from `main`.

No production credentials or private keys should be committed to this repository.
