export const QUOTES = [
  "The good physician treats the disease; the great physician treats the patient who has the disease.",
  "Wherever the art of medicine is loved, there is also a love of humanity.",
  "Medicine is learned by the bedside and not in the classroom.",
  "To study medicine is to study humanity.",
  "The physician who knows only medicine knows not even medicine.",
  "Diagnosis is not the end, but the beginning of practice.",
  "The most important tool in medicine is a listening ear.",
  "Treat the patient, not the investigation.",
  "Every patient is a story — find its theme.",
  "When you hear hoofbeats, think horses — but know the zebras.",
  "History-taking is 80% of the diagnosis.",
  "Healing is a matter of time, but sometimes also a matter of opportunity.",
  "First, do no harm.",
  "Rare diseases are rare; common diseases present uncommonly.",
  "The art of medicine consists in amusing the patient while nature cures the disease.",
  "Active recall beats passive review every single time.",
  "Spaced repetition is your competitive edge over every rote learner.",
  "Test yourself often — retrieval practice is the superior study strategy.",
  "Struggle is where learning lives — embrace the hard questions.",
  "Focus on mechanisms — the details follow naturally.",
  "Understand the pathophysiology and every drug class becomes obvious.",
  "Sleep is not lost study time — it is when memories consolidate.",
  "Review today what you learned yesterday — that gap is where retention lives.",
  "NEET PG rewards applied understanding, not raw memory.",
  "INI CET tests clinical reasoning first, facts second.",
  "USMLE Step 1 is a physiology exam wearing a factual disguise.",
  "Every question stem hides the diagnosis — read it twice.",
  "Consistency beats intensity when intensity is temporary.",
  "Discipline is choosing what you want most over what you want now.",
  "You don't rise to goals — you fall to your systems.",
  "The expert in anything was once a complete beginner.",
  "Progress, not perfection, is the standard.",
  "Motivation gets you started; habit keeps you going.",
  "Hard work beats talent when talent does not work hard.",
];

export function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}
