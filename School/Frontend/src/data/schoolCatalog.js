// Kanthast School: what exists today, counted from Course-Content/source
// (the NCERT 2025-26 lesson scripts). Lessons are scripted; the animated
// videos are in production. Recount before changing these numbers.
const SCHOOL_CATALOG = {
  classes: [
    {
      id: "class-8",
      name: "Class VIII",
      chapters: 52,
      lessons: 266,
      subjects: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Sanskrit"],
      sample: ["A Square and A Cube", "The Invisible Living World", "The Rise of the Marathas"],
    },
    {
      id: "class-9",
      name: "Class IX",
      chapters: 60,
      lessons: 323,
      subjects: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Information Technology"],
      sample: ["Matter in Our Surroundings", "Number Systems", "The French Revolution"],
    },
    {
      id: "class-10",
      name: "Class X",
      chapters: 64,
      lessons: 334,
      subjects: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Information Technology"],
      sample: ["Real Numbers", "Electricity", "Nationalism in India"],
    },
  ],
  totals: { classes: 3, chapters: 176, lessons: 923 },
  lessonLength: "2 to 3.5 minutes",
  price: "Rs 5,000",
};

// A real lesson script: Class X Science, Chapter 11 (Electricity), topic 1,
// "Electric Current and Circuit", first three scenes.
export const SAMPLE_SCRIPT = {
  lesson: "Electric Current and Circuit",
  context: "Class X Science, Chapter 11: Electricity",
  scenes: [
    {
      animation:
        "A dark room; Zippy flicks a switch and a bulb lights up. Camera zooms into the wire, where cartoon electrons shuffle along like a queue at a ticket counter.",
      lines: [
        { speaker: "Zippy", text: "Whoa! How does the bulb know I pressed the switch?" },
        { speaker: "Neo", text: "It doesn't. The switch just completes the path, so charge can finally flow." },
      ],
    },
    {
      animation:
        "A simple loop is drawn: cell, wire, bulb and switch. When the switch opens, a gap appears and the electron queue freezes with the bulb going dark; when it closes, the queue moves and the bulb glows.",
      lines: [
        { speaker: "Neo", text: "A continuous and closed path of an electric current is called an electric circuit." },
        { speaker: "Neo", text: "Open the switch and the circuit breaks, so the current stops and the bulb goes off." },
      ],
    },
    {
      animation:
        "A cartoon gatekeeper counts electrons passing a cross-section with a stopwatch. The equation 'I = Q / t' writes itself, then '1 A = 1 C / 1 s'.",
      lines: [
        { speaker: "Neo", text: "Electric current is the amount of charge flowing through a cross-section of a conductor per unit time." },
        { speaker: "Neo", text: "So I equals Q by t. Charge is measured in coulombs, and current in amperes." },
      ],
    },
  ],
};

export default SCHOOL_CATALOG;
