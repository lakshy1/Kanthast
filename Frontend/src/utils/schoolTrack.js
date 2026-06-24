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

export const schoolSubjects = [
  {
    name: "Science",
    chapters: ["Living World", "Food and Nutrition", "Light and Sound", "Matter Around Us"],
  },
  {
    name: "Mathematics",
    chapters: ["Numbers", "Fractions and Decimals", "Geometry", "Measurement"],
  },
  {
    name: "Social Studies",
    chapters: ["Maps and Places", "People and Communities", "Resources", "Civics Basics"],
  },
  {
    name: "English",
    chapters: ["Grammar Lab", "Reading Comprehension", "Writing Skills", "Vocabulary Builder"],
  },
];

const validSchoolClassValues = new Set(schoolClassOptions.map((item) => item.value));

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

export function buildSchoolModules(classValue = getSelectedSchoolClass()) {
  const classLabel = getSchoolClassLabel(classValue) || `Class ${classValue}`;
  const classNumber = Number(classValue) || 8;
  return Object.fromEntries(
    schoolSubjects.map((subject, subjectIndex) => [
      subject.name,
      {
        totalDuration: `${6 + subjectIndex}h ${20 + classNumber}m`,
        sections: subject.chapters.map((chapter, chapterIndex) => ({
          title: `${classLabel} ${chapter}`,
          total: `${1 + chapterIndex}h ${10 + classNumber}m`,
          id: `${subject.name}-${classValue}-${chapterIndex}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          lectures: Array.from({ length: 4 }).map((_, lectureIndex) => ({
            title: `${chapter} - Visual Lesson ${lectureIndex + 1}`,
            duration: `0${lectureIndex + 4}:${(classNumber + lectureIndex * 7) % 60}`.slice(-5),
            summary: `Key ideas from ${chapter} for ${classLabel}.`,
            videoLink: "",
            photos: [],
            videoId: `school-${classValue}-${subjectIndex}-${chapterIndex}-${lectureIndex}`,
            chapterId: `school-${classValue}-${subjectIndex}-${chapterIndex}`,
            subjectId: `school-${classValue}-${subjectIndex}`,
          })),
        })),
      },
    ])
  );
}
