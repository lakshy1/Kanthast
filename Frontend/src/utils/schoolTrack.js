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
        "A Square and A Cube",
        "Power Play",
        "A Story of Numbers",
        "Quadrilaterals",
        "Number Play",
        "We Distribute, Yet Things Multiply",
        "Proportional Reasoning-1",
        "Fractions in Disguise",
        "The Baudhayana-Pythagoras Theorem",
        "Proportional Reasoning-2",
        "Exploring Some Geometric Themes",
        "Tales by Dots and Lines",
        "Algebra Play",
        "Area",
      ],
    },
    {
      name: "Science",
      chapters: [
        "Exploring the Investigative World of Science",
        "The Invisible Living World: Beyond Our Naked Eye",
        "Health: The Ultimate Treasure",
        "Electricity: Magnetic and Heating Effects",
        "Exploring Forces",
        "Pressure, Winds, Storms, and Cyclones",
        "Particulate Nature of Matter",
        "Nature of Matter: Elements, Compounds, and Mixtures",
        "The Amazing World of Solutes, Solvents, and Solutions",
        "Light: Mirrors and Lenses",
        "Keeping Time with the Skies",
        "How Nature Works in Harmony",
        "Our Home: Earth, a Unique Life Sustaining Planet",
      ],
    },
    {
      name: "English",
      chapters: [
        "Unit 1: Wit and Wisdom",
        "Unit 2: Values and Dispositions",
        "Unit 3: Mystery and Magic",
        "Unit 4: Environment",
        "Unit 5: Science and Curiosity",
        "Grammar and Writing",
      ],
    },
    {
      name: "Social Science",
      chapters: [
        "Natural Resources and Their Use",
        "Reshaping India's Political Map",
        "The Rise of the Marathas",
        "The Colonial Era in India",
        "Universal Franchise and India's Electoral System",
        "The Parliamentary System: Legislature and Executive",
        "Factors of Production",
        "World Geography: Some Glimpses",
        "India's Long Road to Independence",
        "A Journey Through Indian Architecture",
        "The Role of the Judiciary in Our Society",
        "Citizenship: Rights and Duties",
        "Dynamics of Population",
        "India's Urban Landscape",
        "Cultural Currents: 13th to 17th Centuries",
      ],
    },
    { name: "Hindi", chapters: ["मल्हार: पाठ", "व्याकरण और लेखन"] },
    { name: "Sanskrit", chapters: ["दीपकम्: पाठ", "दीपकम्: पाठ (भाग 2)"] },
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
        "Circles",
        "Heron's Formula",
        "Surface Areas and Volumes",
        "Statistics",
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
        "Sound",
        "Improvement in Food Resources",
      ],
    },
    {
      name: "English",
      chapters: [
        "Grammar",
        "Writing Skills",
        "The Fun They Had",
        "The Sound of Music",
        "The Little Girl",
        "A Truly Beautiful Mind",
        "The Snake and the Mirror",
        "My Childhood",
        "Reach for the Top",
        "Kathmandu",
        "If I Were You",
        "The Road Not Taken by Robert Frost",
        "Wind by Subramania Bharati",
        "Rain on the Roof by Coates Kinney",
        "The Lake Isle of Innisfree by W. B. Yeats",
        "A Legend of the Northland by Phoebe Cary",
        "No Men Are Foreign by James Kirkup",
        "On Killing a Tree by Gieve Patel",
        "A Slumber Did My Spirit Seal by William Wordsworth",
        "The Lost Child",
        "The Adventures of Toto",
        "Iswaran the Storyteller",
        "In the Kingdom of Fools",
        "The Happy Prince",
        "The Last Leaf",
        "A House Is Not a Home",
        "The Beggar",
      ],
    },
    {
      name: "Social Science",
      chapters: [
        "The French Revolution",
        "Socialism in Europe and the Russian Revolution",
        "Nazism and the Rise of Hitler",
        "Forest Society and Colonialism",
        "Pastoralists in the Modern World",
        "India Size and Location",
        "Physical Features of India",
        "Drainage",
        "Climate",
        "Natural Vegetation and Wildlife",
        "Population",
        "What is Democracy Why Democracy",
        "Constitutional Design",
        "Electoral Politics",
        "Working of Institutions",
        "Democratic Rights",
        "The Story of Village Palampur",
        "People as Resource",
        "Poverty as a Challenge",
        "Food Security in India",
      ],
    },
    {
      name: "Hindi",
      chapters: [
        "कबीर: साखियाँ एवं सबद",
        "ललद्यद: वाख",
        "रसखान: सवैये",
        "कैदी और कोकिला",
        "ग्राम श्री",
        "मेघ आए",
        "बच्चे काम पर जा रहे हैं",
        "दो बैलों की कथा",
        "ल्हासा की ओर",
        "उपभोक्तावाद की संस्कृति",
        "साँवले सपनों की याद",
        "प्रेमचंद के फटे जूते",
        "मेरे बचपन के दिन",
        "इस जल प्रलय में",
        "मेरे संग की औरतें",
        "रीढ़ की हड्डी",
        "व्याकरण",
        "लेखन",
      ],
    },
    {
      name: "Information Technology",
      chapters: [
        "Employability Skills",
        "Introduction to IT-ITeS Industry",
        "Data Entry and Keyboarding Skills",
        "Digital Documentation",
        "Electronic Spreadsheet",
        "Digital Presentation",
      ],
    },
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
        "Areas Related to Circles",
        "Surface Areas and Volumes",
        "Statistics",
        "Probability",
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
        "Heredity",
        "Light Reflection and Refraction",
        "Human Eye and the Colourful World",
        "Electricity",
        "Magnetic Effects of Electric Current",
        "Our Environment",
      ],
    },
    {
      name: "English",
      chapters: [
        "Grammar",
        "Writing Skills",
        "A Letter to God",
        "Nelson Mandela: Long Walk to Freedom",
        "Two Stories about Flying",
        "From the Diary of Anne Frank",
        "Glimpses of India",
        "Mijbil the Otter",
        "Madam Rides the Bus",
        "The Sermon at Benares",
        "The Proposal",
        "Dust of Snow by Robert Frost",
        "Fire and Ice by Robert Frost",
        "A Tiger in the Zoo by Leslie Norris",
        "How to Tell Wild Animals by Carolyn Wells",
        "The Ball Poem by John Berryman",
        "Amanda! by Robin Klein",
        "The Trees by Adrienne Rich",
        "Fog by Carl Sandburg",
        "The Tale of Custard the Dragon by Ogden Nash",
        "For Anne Gregory by W.B. Yeats",
        "A Triumph of Surgery",
        "The Thief's Story",
        "The Midnight Visitor",
        "A Question of Trust",
        "Footprints Without Feet",
        "The Making of a Scientist",
        "The Necklace",
        "Bholi",
        "The Book That Saved the Earth",
      ],
    },
    {
      name: "Social Science",
      chapters: [
        "The Rise of Nationalism in Europe",
        "Nationalism in India",
        "The Making of a Global World",
        "The Age of Industrialisation",
        "Print Culture and the Modern World",
        "Resources and Development",
        "Forest and Wildlife Resources",
        "Water Resources",
        "Agriculture",
        "Minerals and Energy Resources",
        "Manufacturing Industries",
        "Lifelines of National Economy",
        "Power Sharing",
        "Federalism",
        "Gender Religion and Caste",
        "Political Parties",
        "Outcomes of Democracy",
        "Development",
        "Sectors of the Indian Economy",
        "Money and Credit",
        "Globalisation and the Indian Economy",
        "Consumer Rights",
      ],
    },
    {
      name: "Hindi",
      chapters: [
        "सूरदास के पद",
        "राम-लक्ष्मण-परशुराम संवाद",
        "आत्मकथ्य",
        "उत्साह",
        "अट नहीं रही है",
        "यह दंतुरित मुसकान",
        "फसल",
        "संगतकार",
        "नेताजी का चश्मा",
        "बालगोबिन भगत",
        "लखनवी अंदाज़",
        "एक कहानी यह भी",
        "नौबतखाने में इबादत",
        "संस्कृति",
        "माता का अँचल",
        "साना-साना हाथ जोड़ि",
        "मैं क्यों लिखता हूँ?",
        "व्याकरण",
        "लेखन",
      ],
    },
    { name: "Information Technology", chapters: ["Employability Skills", "Digital Documentation Advanced", "Electronic Spreadsheet", "Database Management", "Maintain Healthy, Safe and Secure Working Environment"] },
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

// Class IX-X Hindi chapters are the NCERT lesson names in Devanagari; the
// transliterated Hindi patterns above would give mixed-script titles
// ("सूरदास के पद ka parichay"), so those chapters use these instead.
const DEVANAGARI_TOPIC_PATTERNS = [
  "{chapter}: परिचय",
  "{chapter}: मुख्य शब्द",
  "{chapter}: भावार्थ",
  "{chapter}: व्याकरण बिंदु",
  "{chapter}: प्रश्नोत्तर",
  "{chapter}: लेखन अभ्यास",
  "{chapter}: पुनरावृत्ति",
  "{chapter}: महत्वपूर्ण बिंदु",
  "{chapter}: अभ्यास प्रश्न",
  "{chapter}: परीक्षा तैयारी",
];

const DEVANAGARI = /[ऀ-ॿ]/;

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

// Per-subject visual identity for School-track course cards. The Dashboard's
// card art was five stock Medical-track photos (hearts, IV drips, clinical
// case studies) reused for every subject regardless of track — a Class X
// "Real Numbers" card showed a cardiology illustration. There's no School-
// specific photography to swap in, so each subject gets a distinct gradient
// and icon instead of a mismatched photo; `icon` is a react-icons/fa export
// name, resolved to a component where this is consumed (keeps this data
// file free of a UI-framework import).
export const SCHOOL_SUBJECT_VISUALS = {
  Mathematics: { icon: "FaCalculator", from: "#1d4ed8", to: "#0891b2" },
  Science: { icon: "FaFlask", from: "#059669", to: "#0d9488" },
  English: { icon: "FaBookOpen", from: "#7c3aed", to: "#6366f1" },
  Hindi: { icon: "FaLanguage", from: "#ea580c", to: "#d97706" },
  Sanskrit: { icon: "FaOm", from: "#b45309", to: "#92400e" },
  EVS: { icon: "FaLeaf", from: "#16a34a", to: "#65a30d" },
  "Social Studies": { icon: "FaLandmark", from: "#be185d", to: "#9d174d" },
  "Social Science": { icon: "FaLandmark", from: "#be185d", to: "#9d174d" },
  "General Knowledge": { icon: "FaGlobeAsia", from: "#0369a1", to: "#0284c7" },
  "Computer Basics": { icon: "FaDesktop", from: "#4338ca", to: "#3730a3" },
  "Information Technology": { icon: "FaLaptopCode", from: "#4338ca", to: "#3730a3" },
};

export const DEFAULT_SUBJECT_VISUAL = { icon: "FaGraduationCap", from: "#334155", to: "#1e293b" };

export function getSubjectVisual(subjectName) {
  return SCHOOL_SUBJECT_VISUALS[subjectName] || DEFAULT_SUBJECT_VISUAL;
}

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

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("kanthastUser") || "null");
  } catch {
    return null;
  }
}

// A logged-in user's track is a fixed backend fact tied to their account,
// not something that should follow whichever track page this browser
// happened to visit most recently. Prefer it once it exists; the ambient
// `kanthastTrack` flag only decides the track for a signed-out visitor
// browsing the public marketing pages.
export function isSchoolTrack() {
  const user = getStoredUser();
  if (user?.track) return user.track === "school";
  return getSelectedTrack() === "school";
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
  const patterns = DEVANAGARI.test(chapter)
    ? DEVANAGARI_TOPIC_PATTERNS
    : SUBJECT_TOPIC_PATTERNS[subjectName] || DEFAULT_TOPIC_PATTERNS;
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
          // slugify drops Devanagari, so a Hindi chapter name contributes nothing and every
          // chapter would share "hindi-10"; fall back to the index to keep ids unique.
          id: slugify(chapter)
            ? slugify(`${subject.name}-${classValue}-${chapter}`)
            : `${slugify(subject.name)}-${classValue}-chapter-${chapterIndex + 1}`,
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
