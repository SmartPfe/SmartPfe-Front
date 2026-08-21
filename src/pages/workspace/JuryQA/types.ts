export type JuryQuestion = {
  id: string;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  source: "report" | "presentation" | "defense" | "cross-analysis";
  reason?: string;
  relatedSlide?: number;
  relatedSection?: string;
  followUpFor?: string;
  answer?: {
    transcript?: string;
    audioMetadata?: {
      mimeType?: string;
      sizeBytes?: number;
    };
    durationSeconds?: number;
    answeredAt?: string;
  };
  evaluation?: JuryAnswerEvaluation;
};

export type JuryAnswerEvaluation = {
  transcript: string;
  score: number;
  scores: {
    correctness: number;
    relevance: number;
    clarity: number;
    depth: number;
    justification: number;
  };
  strengths: string[];
  weaknesses: string[];
  missingPoints: string[];
  feedback: string;
  idealAnswer: string;
  shouldAskFollowUp?: boolean;
  followUpReason?: string;
};

export type FinalJuryEvaluation = {
  overallScore: number;
  overallLabel: string;
  readinessLevel: "Not Ready" | "Needs More Practice" | "Almost Ready" | "Ready" | "Highly Ready" | "";
  readinessPercent: number;
  readinessExplanation: string;
  categoryScores: {
    presentationDelivery: number;
    contentMastery: number;
    technicalKnowledge: number;
    qaPerformance: number;
    clarity: number;
    criticalThinking: number;
  };
  strengths: string[];
  weaknesses: string[];
  defenseVsQA: string;
  revisionTopics: Array<{ topic: string; reason: string }>;
  actionPlan: string[];
};

export type JuryQASessionRecord = {
  _id?: string;
  juryAttemptId: string;
  attemptNumber?: number;
  presentationVersion: number;
  pitchVersion: number;
  reportVersion?: number;
  questions: JuryQuestion[];
  finalEvaluation?: FinalJuryEvaluation;
  status: "generated" | "in-progress" | "completed" | "failed";
  createdAt?: string;
  completedAt?: string;
};
