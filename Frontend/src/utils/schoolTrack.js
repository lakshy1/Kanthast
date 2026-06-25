export const TRACK_STORAGE_KEY = "kanthastTrack";
export const SCHOOL_CLASS_KEY = "kanthastSchoolClass";

export const schoolClassOptions = [
  { value: "1", label: "Class I" },
  { value: "2", label: "Class II" },
  { value: "3", label: "Class III" },
  { value: "4", label: "Class IV" },
  { value: "5", label: "Class V" },
  { value: "6", label: "Class VI" },
  { value: "7", label: "Class VII" },
  { value: "8", label: "Class VIII" },
  { value: "9", label: "Class IX" },
  { value: "10", label: "Class X" },
];

const SCHOOL_CURRICULUM = {
  "1": [
    { name: "Mathematics", chapters: ["Numbers up to 20", "Addition Stories", "Subtraction Stories", "Shapes Around Us", "Measurement Basics"] },
    { name: "English", chapters: ["Alphabet and Sounds", "Simple Words", "Reading Small Sentences", "Naming Words", "My Family and School"] },
    { name: "EVS", chapters: ["My Body", "My Family", "Food We Eat", "Plants and Animals", "Weather and Water"] },
    { name: "Hindi", chapters: ["Varnamala", "Shabd aur Vakya", "Ginti", "Mera Parivar", "Mere Aas-Paas"] },
    { name: "General Knowledge", chapters: ["Colors and Shapes", "Community Helpers", "Festivals", "Good Habits", "Our National Symbols"] },
  ],
  "2": [
    { name: "Mathematics", chapters: ["Numbers up to 100", "Addition and Subtraction", "Skip Counting", "Money and Time", "Patterns and Shapes"] },
    { name: "English", chapters: ["Reading Paragraphs", "Action Words", "Naming and Describing Words", "Picture Composition", "Everyday Conversations"] },
    { name: "EVS", chapters: ["Our Body and Health", "Home and School", "Food and Shelter", "Transport and Safety", "Plants and Seasons"] },
    { name: "Hindi", chapters: ["Matra Words", "Vakya Nirman", "Kahani Path", "Ritu aur Tyohar", "Mera Shehar"] },
    { name: "General Knowledge", chapters: ["Animals Around Us", "Famous Places", "Inventors and Machines", "Sports and Games", "Cleanliness and Care"] },
  ],
  "3": [
    { name: "Mathematics", chapters: ["Numbers up to 1000", "Multiplication", "Division Basics", "Fractions", "Length, Weight and Capacity"] },
    { name: "English", chapters: ["Comprehension Practice", "Sentence Building", "Nouns, Verbs and Adjectives", "Story Writing", "Poetry Time"] },
    { name: "EVS", chapters: ["Living and Non-Living Things", "Our Neighbourhood", "Water and Air", "Food Chains", "Travel and Communication"] },
    { name: "Hindi", chapters: ["Sangya aur Kriya", "Anuchhed Lekhan", "Kahani aur Kavita", "Patra Lekhan", "Prakriti aur Paryavaran"] },
    { name: "Computer Basics", chapters: ["Parts of a Computer", "Using a Keyboard", "Paint and Drawing", "Files and Folders", "Safe Computer Habits"] },
  ],
  "4": [
    { name: "Mathematics", chapters: ["Large Numbers", "Multiples and Factors", "Geometry", "Perimeter and Area", "Data Handling"] },
    { name: "English", chapters: ["Reading Fluency", "Grammar Workshop", "Letter Writing", "Creative Writing", "Reference Skills"] },
    { name: "EVS", chapters: ["Teeth and Digestion", "Plants Around Us", "Maps and Directions", "Natural Resources", "Work and People"] },
    { name: "Hindi", chapters: ["Vyakaran", "Muhavare", "Nibandh Lekhan", "Patra aur Samvad", "Bharat ki Sanskriti"] },
    { name: "Social Studies", chapters: ["Our Country", "Landforms", "States and Capitals", "Ancient Communities", "Civic Responsibility"] },
  ],
  "5": [
    { name: "Mathematics", chapters: ["Place Value", "Decimals", "Factors and Multiples", "Angles and Shapes", "Volume and Measurement"] },
    { name: "English", chapters: ["Reading for Meaning", "Tenses and Grammar", "Notice and Message Writing", "Poems and Stories", "Vocabulary Building"] },
    { name: "EVS", chapters: ["Reproduction in Plants", "Health and Hygiene", "Our Environment", "Natural Disasters", "Simple Machines"] },
    { name: "Hindi", chapters: ["Vachan aur Ling", "Kahani Lekhan", "Kavita Adhyayan", "Patra aur Suchna", "Paryavaran Sanrakshan"] },
    { name: "Social Studies", chapters: ["Globe and Maps", "The Freedom Movement", "Democracy", "Transport and Trade", "Resources and Conservation"] },
  ],
  "6": [
    {
      name: "Mathematics",
      chapters: [
        "Knowing Our Numbers",
        "Whole Numbers",
        "Playing with Numbers",
        "Basic Geometrical Ideas",
        "Integers",
        "Fractions",
        "Decimals",
        "Data Handling",
        "Mensuration",
        "Algebra",
      ],
    },
    {
      name: "Science",
      chapters: [
        "Food Where Does It Come From",
        "Components of Food",
        "Fibre to Fabric",
        "Sorting Materials into Groups",
        "Separation of Substances",
        "Changes Around Us",
        "Getting to Know Plants",
        "Body Movements",
        "Motion and Measurement of Distances",
        "Light Shadows and Reflections",
      ],
    },
    {
      name: "English",
      chapters: [
        "Reading Comprehension",
        "Grammar Foundations",
        "Sentence Writing",
        "Vocabulary Builder",
        "Poetry Appreciation",
        "Speaking and Listening",
      ],
    },
    {
      name: "Social Science",
      chapters: [
        "What, Where, How and When",
        "From Hunting Gathering to Growing Food",
        "In the Earliest Cities",
        "Maps",
        "Major Domains of the Earth",
        "Understanding Diversity",
      ],
    },
    { name: "Hindi", chapters: ["Bhasha aur Vyakaran", "Gadya Path", "Kavita Path", "Anuchhed Lekhan", "Patra Lekhan", "Aupcharik Vartalap"] },
    { name: "Sanskrit", chapters: ["Varna Vichar", "Shabd Roop", "Dhatu Roop", "Saral Anuvad", "Subhashitani"] },
  ],
  "7": [
    {
      name: "Mathematics",
      chapters: [
        "Integers",
        "Fractions and Decimals",
        "Data Handling",
        "Simple Equations",
        "Lines and Angles",
        "The Triangle and Its Properties",
        "Comparing Quantities",
        "Rational Numbers",
        "Perimeter and Area",
        "Algebraic Expressions",
      ],
    },
    {
      name: "Science",
      chapters: [
        "Nutrition in Plants",
        "Nutrition in Animals",
        "Heat",
        "Acids Bases and Salts",
        "Physical and Chemical Changes",
        "Respiration in Organisms",
        "Transportation in Animals and Plants",
        "Reproduction in Plants",
        "Motion and Time",
        "Electric Current and Its Effects",
      ],
    },
    {
      name: "English",
      chapters: [
        "Reading Strategies",
        "Story Elements",
        "Grammar and Usage",
        "Writing Paragraphs",
        "Poems and Rhyme",
        "Speech Practice",
      ],
    },
    {
      name: "Social Science",
      chapters: [
        "Tracing Changes Through a Thousand Years",
        "New Kings and Kingdoms",
        "The Delhi Sultans",
        "Environment",
        "Inside Our Earth",
        "On Equality",
      ],
    },
    { name: "Hindi", chapters: ["Apathit Gadyansh", "Vyakaran Prayog", "Kavita Vishleshan", "Patra aur Suchna", "Nibandh Lekhan", "Rachnatmak Lekhan"] },
    { name: "Sanskrit", chapters: ["Sandhi", "Karak", "Shabd Roop Abhyas", "Dhatu Roop Abhyas", "Anuvad Kaushal"] },
  ],
  "8": [
    {
      name: "Mathematics",
      chapters: [
        "Rational Numbers",
        "Linear Equations in One Variable",
        "Understanding Quadrilaterals",
        "Practical Geometry",
        "Data Handling",
        "Squares and Square Roots",
        "Cubes and Cube Roots",
        "Comparing Quantities",
        "Algebraic Expressions and Identities",
        "Mensuration",
      ],
    },
    {
      name: "Science",
      chapters: [
        "Crop Production and Management",
        "Microorganisms Friend and Foe",
        "Synthetic Fibres and Plastics",
        "Materials Metals and Non-Metals",
        "Coal and Petroleum",
        "Combustion and Flame",
        "Conservation of Plants and Animals",
        "Cell Structure and Functions",
        "Reproduction in Animals",
        "Force and Pressure",
      ],
    },
    {
      name: "English",
      chapters: [
        "Reading and Inference",
        "Grammar in Context",
        "Descriptive Writing",
        "Diary and Letter Writing",
        "Poetry Response",
        "Listening and Speaking",
      ],
    },
    {
      name: "Social Science",
      chapters: [
        "How When and Where",
        "From Trade to Territory",
        "Ruling the Countryside",
        "Resources",
        "Land Soil Water and Natural Vegetation",
        "The Indian Constitution",
      ],
    },
    { name: "Hindi", chapters: ["Bodh Prashn", "Vakya Shuddhi", "Anuchhed aur Samvad", "Kavya Rasgrahan", "Patra Lekhan", "Lekhan Kaushal"] },
    { name: "Sanskrit", chapters: ["Subhashitani", "Avyaya", "Vibhakti", "Anuvad", "Saral Gadyansh"] },
  ],
  "9": [
    {
      name: "Mathematics",
      chapters: [
        "Number Systems",
        "Polynomials",
        "Coordinate Geometry",
        "Linear Equations in Two Variables",
        "Introduction to Euclid Geometry",
        "Lines and Angles",
        "Triangles",
        "Quadrilaterals",
        "Areas of Parallelograms and Triangles",
        "Circles",
      ],
    },
    {
      name: "Science",
      chapters: [
        "Matter in Our Surroundings",
        "Is Matter Around Us Pure",
        "Atoms and Molecules",
        "Structure of the Atom",
        "The Fundamental Unit of Life",
        "Tissues",
        "Motion",
        "Force and Laws of Motion",
        "Gravitation",
        "Work and Energy",
      ],
    },
    {
      name: "English",
      chapters: [
        "Reading for Theme",
        "Literary Devices",
        "Grammar and Editing",
        "Descriptive and Narrative Writing",
        "Speech and Debate",
        "Poetry Study",
      ],
    },
    {
      name: "Social Science",
      chapters: [
        "The French Revolution",
        "Socialism in Europe and the Russian Revolution",
        "India Size and Location",
        "Physical Features of India",
        "What is Democracy Why Democracy",
        "The Story of Village Palampur",
      ],
    },
    { name: "Hindi", chapters: ["Gadya aur Kavya", "Vyakaran", "Srijanatmak Lekhan", "Patra aur Vigyapan", "Apathit Bodh", "Prashnottari Abhyas"] },
    { name: "Information Technology", chapters: ["Communication Skills", "Self Management Skills", "ICT Basics", "Digital Documentation", "Cyber Safety"] },
  ],
  "10": [
    {
      name: "Mathematics",
      chapters: [
        "Real Numbers",
        "Polynomials",
        "Pair of Linear Equations in Two Variables",
        "Quadratic Equations",
        "Arithmetic Progressions",
        "Triangles",
        "Coordinate Geometry",
        "Introduction to Trigonometry",
        "Applications of Trigonometry",
        "Circles",
      ],
    },
    {
      name: "Science",
      chapters: [
        "Chemical Reactions and Equations",
        "Acids Bases and Salts",
        "Metals and Non-Metals",
        "Carbon and Its Compounds",
        "Life Processes",
        "Control and Coordination",
        "How do Organisms Reproduce",
        "Heredity and Evolution",
        "Light Reflection and Refraction",
        "Human Eye and the Colourful World",
      ],
    },
    {
      name: "English",
      chapters: [
        "Analytical Reading",
        "Grammar and Editing Skills",
        "Formal Letter Writing",
        "Analytical Paragraph Writing",
        "Drama and Prose Study",
        "Poetry Interpretation",
      ],
    },
    {
      name: "Social Science",
      chapters: [
        "The Rise of Nationalism in Europe",
        "Nationalism in India",
        "Resources and Development",
        "Forest and Wildlife Resources",
        "Power Sharing",
        "Development",
      ],
    },
    { name: "Hindi", chapters: ["Padya aur Gadya", "Bhasha Gyan", "Nibandh aur Patra", "Suchna aur Vigyapan", "Alochana aur Saransh", "Anuchhed Lekhan"] },
    { name: "Information Technology", chapters: ["Employability Skills", "Digital Documentation Advanced", "Electronic Spreadsheet", "Database Management", "Web Applications and Security"] },
  ],
};

const SUBJECT_TOPIC_PATTERNS = {
  Mathematics: [
    "Introduction to {chapter}",
    "Key definitions in {chapter}",
    "Rule-based examples from {chapter}",
    "Visual models for {chapter}",
    "Worked problems on {chapter}",
    "Word problems using {chapter}",
    "Common mistakes in {chapter}",
    "Fast revision of {chapter}",
    "Practice set for {chapter}",
    "Exam strategies for {chapter}",
  ],
  Science: [
    "Concept overview of {chapter}",
    "Important terms in {chapter}",
    "Daily life examples from {chapter}",
    "Experiments linked to {chapter}",
    "Diagrams and labelling in {chapter}",
    "Cause and effect in {chapter}",
    "Numericals and reasoning in {chapter}",
    "Frequently asked questions on {chapter}",
    "Summary map for {chapter}",
    "Revision quiz for {chapter}",
  ],
  English: [
    "Introduction to {chapter}",
    "Reading the central idea of {chapter}",
    "Vocabulary from {chapter}",
    "Grammar skills linked to {chapter}",
    "Sentence practice for {chapter}",
    "Writing task from {chapter}",
    "Speaking prompts around {chapter}",
    "Comprehension questions on {chapter}",
    "Revision notes for {chapter}",
    "Assessment practice on {chapter}",
  ],
  Hindi: [
    "{chapter} ka parichay",
    "{chapter} ke mukhya shabd",
    "{chapter} ka bhavarth",
    "{chapter} se sambandhit vyakaran",
    "{chapter} ke prashnottar",
    "{chapter} par aadharit lekhan",
    "{chapter} ki punaravriti",
    "{chapter} ke mahatvapurn bindu",
    "{chapter} abhyas prashn",
    "{chapter} pariksha taiyari",
  ],
  Sanskrit: [
    "{chapter} pravesh",
    "{chapter} ke mukhya shabd",
    "{chapter} roop aur prayog",
    "{chapter} ka saral anuvad",
    "{chapter} vakya rachana",
    "{chapter} vyakaran bindu",
    "{chapter} abhyas",
    "{chapter} punaravartan",
    "{chapter} mahatvapurn prashn",
    "{chapter} tvarit taiyari",
  ],
  "Social Science": [
    "Background of {chapter}",
    "Timeline and key events in {chapter}",
    "Important terms from {chapter}",
    "Maps and locations in {chapter}",
    "Cause and effect in {chapter}",
    "People, institutions and ideas in {chapter}",
    "Short answer questions on {chapter}",
    "Long answer themes in {chapter}",
    "Revision bullets for {chapter}",
    "Exam practice for {chapter}",
  ],
  EVS: [
    "Introduction to {chapter}",
    "People and surroundings in {chapter}",
    "Observation activity for {chapter}",
    "Picture talk from {chapter}",
    "Healthy habits in {chapter}",
    "Nature link in {chapter}",
    "Question answers from {chapter}",
    "Quick recap of {chapter}",
    "Worksheet ideas for {chapter}",
    "Oral revision for {chapter}",
  ],
  "General Knowledge": [
    "Quick facts from {chapter}",
    "Picture-based learning in {chapter}",
    "Names and identification in {chapter}",
    "Match the following: {chapter}",
    "Fun quiz on {chapter}",
    "Everyday connections to {chapter}",
    "Memory tricks for {chapter}",
    "Revision points from {chapter}",
    "Practice questions on {chapter}",
    "Rapid recap of {chapter}",
  ],
  "Computer Basics": [
    "Introduction to {chapter}",
    "Main parts and tools in {chapter}",
    "Step-by-step use of {chapter}",
    "Do and don't list for {chapter}",
    "Hands-on activity for {chapter}",
    "Shortcuts and smart tips for {chapter}",
    "Practice exercise on {chapter}",
    "Troubleshooting basics in {chapter}",
    "Revision points for {chapter}",
    "Assessment on {chapter}",
  ],
  "Information Technology": [
    "Introduction to {chapter}",
    "Core concepts in {chapter}",
    "Interface and tools in {chapter}",
    "Hands-on workflow for {chapter}",
    "Shortcuts and productivity in {chapter}",
    "Common errors in {chapter}",
    "Practical assignment on {chapter}",
    "Cyber-safe practices in {chapter}",
    "Revision notes for {chapter}",
    "Exam preparation for {chapter}",
  ],
};

const DEFAULT_TOPIC_PATTERNS = [
  "Introduction to {chapter}",
  "Important ideas in {chapter}",
  "Examples from {chapter}",
  "Guided practice for {chapter}",
  "Quick recap of {chapter}",
  "Skill drill on {chapter}",
  "Common mistakes in {chapter}",
  "Question bank for {chapter}",
  "Revision notes for {chapter}",
  "Assessment prep for {chapter}",
];

const validSchoolClassValues = new Set(schoolClassOptions.map((item) => item.value));

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getSelectedTrack() {
  try {
    return localStorage.getItem(TRACK_STORAGE_KEY) || "medical";
  } catch {
    return "medical";
  }
}

export function isSchoolTrack() {
  return getSelectedTrack() === "school";
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("kanthastUser") || "null");
  } catch {
    return null;
  }
}

export function getSchoolClassLabel(value) {
  return schoolClassOptions.find((item) => item.value === String(value))?.label || "";
}

function normalizeSchoolClass(value) {
  const normalized = String(value || "").trim();
  return validSchoolClassValues.has(normalized) ? normalized : "";
}

export function getSelectedSchoolClass() {
  const user = getStoredUser();
  const fromUser = normalizeSchoolClass(user?.schoolClass || user?.classLevel || user?.selectedClass);
  if (fromUser) return fromUser;
  try {
    return normalizeSchoolClass(localStorage.getItem(SCHOOL_CLASS_KEY)) || "8";
  } catch {
    return "8";
  }
}

export function setSelectedSchoolClass(value) {
  const normalized = normalizeSchoolClass(value);
  if (!normalized) return;
  try {
    localStorage.setItem(SCHOOL_CLASS_KEY, normalized);
  } catch {
    return;
  }
}

export function hasPaidForSchoolClass() {
  const user = getStoredUser();
  const activeClass = normalizeSchoolClass(user?.schoolClass);
  const isSchoolSubscription = user?.track === "school" || user?.subscriptionPlan === "school-class-1y";
  return Boolean(user?.subscriptionPurchased && isSchoolSubscription && activeClass);
}

export function mergeSchoolClassIntoUser(classValue) {
  const normalized = normalizeSchoolClass(classValue);
  if (!normalized) return;
  const user = getStoredUser();
  if (!user) return;
  const merged = { ...user, track: "school", schoolClass: normalized };
  localStorage.setItem("kanthastUser", JSON.stringify(merged));
}

function buildChapterTopics({ classValue, subjectName, chapter, subjectIndex, chapterIndex }) {
  const patterns = SUBJECT_TOPIC_PATTERNS[subjectName] || DEFAULT_TOPIC_PATTERNS;
  const classNumber = Number(classValue) || 1;
  return patterns.map((pattern, topicIndex) => ({
    title: pattern.replaceAll("{chapter}", chapter),
    duration: `${String(4 + ((classNumber + topicIndex) % 6)).padStart(2, "0")}:${String((12 + topicIndex * 5 + chapterIndex * 3) % 60).padStart(2, "0")}`,
    summary: `${chapter} notes for ${subjectName} in ${getSchoolClassLabel(classValue) || `Class ${classValue}`}.`,
    videoLink: "",
    photos: [],
    videoId: `school-${classValue}-${subjectIndex}-${chapterIndex}-${topicIndex}`,
    chapterId: `school-${classValue}-${subjectIndex}-${chapterIndex}`,
    subjectId: `school-${classValue}-${subjectIndex}`,
  }));
}

export function getSchoolSubjectsForClass(classValue = getSelectedSchoolClass()) {
  return SCHOOL_CURRICULUM[String(classValue)] || SCHOOL_CURRICULUM["8"];
}

export function buildSchoolModules(classValue = getSelectedSchoolClass()) {
  const subjects = getSchoolSubjectsForClass(classValue);
  return Object.fromEntries(
    subjects.map((subject, subjectIndex) => [
      subject.name,
      {
        totalDuration: `${8 + subject.chapters.length}h ${10 + subjectIndex * 5}m`,
        sections: subject.chapters.map((chapter, chapterIndex) => ({
          title: chapter,
          total: `${1 + (chapterIndex % 3)}h ${15 + chapterIndex * 4}m`,
          id: slugify(`${subject.name}-${classValue}-${chapter}`) || `chapter-${chapterIndex + 1}`,
          lectures: buildChapterTopics({
            classValue,
            subjectName: subject.name,
            chapter,
            subjectIndex,
            chapterIndex,
          }),
        })),
      },
    ])
  );
}
