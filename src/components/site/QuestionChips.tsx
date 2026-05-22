import { Link } from "@tanstack/react-router";

const QUESTIONS = [
  "Will I become rich?",
  "When will I marry?",
  "Will I succeed in business?",
  "What career suits me?",
  "What is my hidden talent?",
  "Will I settle abroad?",
  "How is my love life?",
  "Is leadership in my destiny?",
  "What blocks my success?",
  "What does my fate line reveal?",
  "What age brings transformation?",
  "Is entrepreneurship good for me?",
  "What karmic lessons do I carry?",
  "What does my heart line say?",
];

export function QuestionChips() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {QUESTIONS.map((q) => (
        <Link
          key={q}
          to="/scan"
          className="px-5 py-2.5 rounded-full text-sm bg-white/[0.03] border border-border text-foreground/80 hover:border-accent hover:text-accent transition-all"
        >
          {q}
        </Link>
      ))}
    </div>
  );
}
