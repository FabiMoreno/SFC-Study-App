const SUPABASE_URL = "https://qmpuohavzvftoynaxhwn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_MCoGaZaGgLZWajrtkLrs8g_iCATio56";

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.hint || `Supabase request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

window.SFCBackend = {
  async getProfiles() {
    return supabaseRequest("profiles?select=id,name,slug,avatar_initial&order=name.asc");
  },

  async getQuestions() {
    return supabaseRequest(
      "questions?select=id,question_text,options,difficulty,sbok_reference,study_enabled,practice_enabled,mock_enabled,topics(category,topic,subtopic)&is_active=eq.true&order=id.asc"
    );
  },

  async getStudyReviews(profileId) {
    return supabaseRequest(
      `study_reviews?select=id,question_id,was_correct,reviewed_at&profile_id=eq.${encodeURIComponent(profileId)}&order=reviewed_at.desc`
    );
  },

  async saveStudyReview(profileId, questionId, wasCorrect) {
    return supabaseRequest("study_reviews", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: {
        profile_id: profileId,
        question_id: questionId,
        was_correct: wasCorrect
      }
    });
  },

  async getStudyFeedback(questionId) {
    const rows = await supabaseRequest("rpc/get_study_feedback", {
      method: "POST",
      body: { p_question_id: questionId }
    });

    return rows?.[0] || null;
  },

  async getPracticeHistory(profileId, limit = 10) {
    return supabaseRequest(
      `exam_attempts?select=id,mode,started_at,completed_at,total_questions,correct_answers,percentage,duration_seconds,question_ids&profile_id=eq.${encodeURIComponent(profileId)}&mode=eq.practice&completed_at=not.is.null&order=completed_at.desc&limit=${limit}`
    );
  },

  async createPracticeAttempt(profileId, questionIds) {
    const rows = await supabaseRequest("exam_attempts?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: {
        profile_id: profileId,
        mode: "practice",
        total_questions: questionIds.length,
        question_ids: questionIds
      }
    });

    return rows?.[0] || null;
  },

  async submitPracticeAnswers(attemptId, answers) {
    await supabaseRequest("attempt_answers", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: answers.map((answer) => ({
        attempt_id: attemptId,
        question_id: answer.questionId,
        selected_answer: answer.selectedAnswer
      }))
    });
  },

  async getAttempt(attemptId) {
    const rows = await supabaseRequest(
      `exam_attempts?select=*&id=eq.${encodeURIComponent(attemptId)}&limit=1`
    );

    return rows?.[0] || null;
  },

  async getPracticeReview(attemptId) {
    return supabaseRequest("rpc/get_practice_review", {
      method: "POST",
      body: { p_attempt_id: attemptId }
    });
  },

  async getDashboardAttempts() {
    return supabaseRequest(
      "exam_attempts?select=id,profile_id,mode,started_at,completed_at,total_questions,correct_answers,percentage,duration_seconds,question_ids&completed_at=not.is.null&order=completed_at.asc"
    );
  },

  async getDashboardAnswers() {
    return supabaseRequest(
      "attempt_answers?select=attempt_id,question_id,selected_answer,is_correct,answered_at&order=answered_at.asc"
    );
  },

  async getDashboardStudyReviews() {
    return supabaseRequest(
      "study_reviews?select=id,profile_id,question_id,was_correct,reviewed_at&order=reviewed_at.asc"
    );
  }
};
