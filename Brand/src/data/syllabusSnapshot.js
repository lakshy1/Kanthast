// Snapshot of the live Medicine/USMLE syllabus (GET /api/v1/medicine-usmle),
// captured 2026-09-29. Chapter names have the admin "(New)" suffix removed. Used by the homepage so the product preview renders
// instantly and survives a sleeping backend; live counts replace it once the
// catalog loads. These are syllabus entries, not published videos: see
// PRODUCT.md before quoting any of it as "available to watch".
const SYLLABUS_SNAPSHOT = {
  "capturedOn": "2026-09-29",
  "subjects": [
    {
      "name": "Biochemistry",
      "chapters": 23,
      "lectures": 204,
      "sampleChapters": [
        "Vitamins",
        "Biochemical Pathways",
        "Metabolic Disorders",
        "Lipids"
      ]
    },
    {
      "name": "Immunology",
      "chapters": 11,
      "lectures": 88,
      "sampleChapters": [
        "Immunoglobulins",
        "Complement",
        "Other Cell Types",
        "B Cells and T Cells"
      ]
    },
    {
      "name": "Pharmacology",
      "chapters": 29,
      "lectures": 334,
      "sampleChapters": [
        "Diabetes Drugs (New)",
        "Antiarrhythmic Drugs (New)",
        "Cardiovascular Drugs (New)",
        "Lipid Lowering Drugs (New)"
      ]
    },
    {
      "name": "Microbiology",
      "chapters": 10,
      "lectures": 200,
      "sampleChapters": [
        "Antibiotics / Antiparasitics",
        "Antifungals",
        "Antivirals",
        "Bacteria - Gram Positive"
      ]
    },
    {
      "name": "Neuroanatomy",
      "chapters": 15,
      "lectures": 91,
      "sampleChapters": [
        "Cranial Nerves",
        "Spinal Tracts",
        "Thalamic Nuclei",
        "Hypothalamic Nuclei"
      ]
    }
  ],
  "medianLectureMinutes": 7,
  "preview": {
    "subject": "Biochemistry",
    "chapters": [
      "Vitamins",
      "Biochemical Pathways",
      "Metabolic Disorders",
      "Lipids",
      "Autosomal Dominant Diseases",
      "Lysosomal Storage Diseases",
      "Glycogen Storage Diseases",
      "Chromosomal Abnormalities",
      "Collagen Related Disorders"
    ],
    "chapter": "Metabolic Disorders",
    "lectures": [
      {
        "name": "Albinism",
        "duration": "05:39"
      },
      {
        "name": "Pyruvate Dehydrogenase Deficiency",
        "duration": "05:48"
      },
      {
        "name": "Pyruvate Kinase Deficiency",
        "duration": "08:13"
      },
      {
        "name": "G6PD Deficiency",
        "duration": "13:07"
      },
      {
        "name": "Essential Fructosuria",
        "duration": "03:48"
      },
      {
        "name": "Hereditary Fructose Intolerance",
        "duration": "07:07"
      },
      {
        "name": "Galactosemia",
        "duration": "12:01"
      },
      {
        "name": "Galactokinase Deficiency",
        "duration": "06:16"
      }
    ]
  },
  "tourPreview": {
    "subject": "Pharmacology",
    "chapters": [
      "Diabetes Drugs",
      "Antiarrhythmic Drugs",
      "Cardiovascular Drugs",
      "Lipid Lowering Drugs",
      "Sympathomimetics and Sympatholytics",
      "Alpha & Beta Blockers",
      "Renal Drugs",
      "Antiepileptics",
      "Psych Drugs"
    ],
    "chapter": "Lipid Lowering Drugs",
    "lectures": [
      {
        "name": "Fish Oil",
        "duration": "10:00"
      },
      {
        "name": "Statins",
        "duration": "17:11"
      },
      {
        "name": "Ezetimibe",
        "duration": "09:56"
      },
      {
        "name": "Fibrates",
        "duration": "13:34"
      },
      {
        "name": "Niacin",
        "duration": "14:33"
      },
      {
        "name": "Bile Acid Resins",
        "duration": "15:04"
      }
    ]
  }
};

export default SYLLABUS_SNAPSHOT;
