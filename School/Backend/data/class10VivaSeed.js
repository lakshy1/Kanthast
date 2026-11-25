// data/class10VivaSeed.js — High-yield CBSE Class X Oral Viva Voce Questions & Rubrics
export const CLASS_10_VIVA_QUESTIONS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SCIENCE (10 Questions)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 1,
    chapterTitle: "Chemical Reactions and Equations",
    difficulty: "easy",
    examinerContext: "Chemistry Practical Viva",
    question: "Why should a magnesium ribbon be cleaned with sandpaper before burning it in air?",
    hint: "Think about what forms on magnesium when it sits exposed to air and moisture.",
    rubricPoints: [
      {
        point: "Magnesium reacts with atmospheric oxygen/moisture to form a protective layer",
        keywords: ["oxygen", "air", "layer", "coating", "film", "moisture", "surface"],
        weight: 1,
      },
      {
        point: "Names the layer as basic magnesium oxide / magnesium carbonate",
        keywords: ["magnesium oxide", "mgo", "carbonate", "oxide"],
        weight: 1.5,
      },
      {
        point: "Cleaning removes this layer so magnesium burns smoothly and completely",
        keywords: ["remove", "clean", "burn", "prevent", "hinder", "properly", "smoothly", "react"],
        weight: 1,
      },
    ],
    modelAnswer:
      "Magnesium is a reactive metal that slowly reacts with oxygen and moisture in the air to form a dull layer of magnesium oxide (or basic magnesium carbonate) on its surface. This layer hinders burning, so we rub it with sandpaper to remove the oxide coating and expose pure magnesium for smooth, complete combustion.",
    examinerTip:
      "Examiners love hearing the exact compound name 'magnesium oxide' and the reason: it prevents further reaction/burning.",
    followUpQuestion: "What is the colour of the flame and the white powder formed after burning?",
  },
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 1,
    chapterTitle: "Chemical Reactions and Equations",
    difficulty: "medium",
    examinerContext: "Chemistry Practical Viva",
    question: "Why is respiration considered an exothermic reaction? Explain with the word or chemical equation.",
    hint: "Think about how glucose reacts with oxygen inside our cells to release energy.",
    rubricPoints: [
      {
        point: "Glucose combines with oxygen in body cells to release energy",
        keywords: ["glucose", "oxygen", "energy", "cells", "release", "atp"],
        weight: 1.5,
      },
      {
        point: "Produces carbon dioxide and water along with heat/energy",
        keywords: ["carbon dioxide", "co2", "water", "h2o"],
        weight: 1,
      },
      {
        point: "Since energy is released during the process, it is exothermic",
        keywords: ["exothermic", "heat", "released", "produces"],
        weight: 1.5,
      },
    ],
    modelAnswer:
      "During digestion, carbohydrates break down into glucose. In our cells, glucose reacts with oxygen to produce carbon dioxide, water, and a large amount of energy needed to keep us alive. Because heat and energy are released during this reaction, respiration is classified as an exothermic process.",
    examinerTip:
      "Always mention 'glucose + oxygen → carbon dioxide + water + energy'—examiners look for the exact reactants and products.",
    followUpQuestion: "Is photosynthesis exothermic or endothermic, and why?",
  },
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 1,
    chapterTitle: "Chemical Reactions and Equations",
    difficulty: "medium",
    examinerContext: "Chemistry Lab Viva",
    question: "What happens when an iron nail is dipped in copper sulphate solution, and what type of reaction is this?",
    hint: "Compare the reactivity of iron and copper, and recall the colour change.",
    rubricPoints: [
      {
        point: "Iron is more reactive than copper and displaces copper from copper sulphate",
        keywords: ["reactive", "displace", "displacement", "iron", "copper"],
        weight: 1.5,
      },
      {
        point: "Blue colour of copper sulphate fades to pale green (ferrous sulphate)",
        keywords: ["blue", "green", "pale green", "ferrous", "fades", "colour"],
        weight: 1.5,
      },
      {
        point: "A reddish-brown coating of copper deposits on the iron nail",
        keywords: ["brown", "reddish", "deposit", "coating", "nail"],
        weight: 1,
      },
    ],
    modelAnswer:
      "This is a single displacement reaction. Because iron is more reactive than copper, it displaces copper from copper sulphate solution to form iron(II) sulphate. As a result, the blue solution turns pale green and a reddish-brown layer of copper deposits onto the iron nail.",
    examinerTip:
      "State all three observations cleanly: displacement reaction, blue-to-green colour change, and brown deposit on the nail.",
    followUpQuestion: "What would happen if a copper strip were placed in ferrous sulphate solution instead?",
  },
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 1,
    chapterTitle: "Chemical Reactions and Equations",
    difficulty: "easy",
    examinerContext: "Chemistry Viva",
    question: "What is rancidity, and why are chips packets flushed with nitrogen gas?",
    hint: "Think about oxidation of fats and oils and why nitrogen is used instead of oxygen.",
    rubricPoints: [
      {
        point: "Rancidity is the oxidation of fats and oils causing bad smell and taste",
        keywords: ["oxidation", "fats", "oils", "smell", "taste", "spoil"],
        weight: 1.5,
      },
      {
        point: "Nitrogen is an inert/unreactive gas that displaces oxygen",
        keywords: ["nitrogen", "inert", "unreactive", "oxygen", "prevent"],
        weight: 1.5,
      },
      {
        point: "Flushing with nitrogen prevents oxidation and keeps chips fresh",
        keywords: ["fresh", "prevent", "oxidation", "rancid"],
        weight: 1,
      },
    ],
    modelAnswer:
      "When fats and oils in food are oxidised by air, their smell and taste turn unpleasant—this is called rancidity. Manufacturers flush chips packets with nitrogen gas because nitrogen is unreactive and drives out oxygen, preventing the oil from oxidising and keeping the chips crisp and fresh.",
    examinerTip:
      "Use the exact phrase 'oxidation of fats and oils' and describe nitrogen as 'unreactive/inert'.",
    followUpQuestion: "Name two other ways to prevent rancidity at home.",
  },
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 2,
    chapterTitle: "Acids, Bases and Salts",
    difficulty: "medium",
    examinerContext: "Chemistry Lab Viva",
    question: "Why should we always add acid slowly to water with constant stirring, and never water to concentrated acid?",
    hint: "Consider the heat released during dilution and what happens to water droplets.",
    rubricPoints: [
      {
        point: "Dilution of an acid is a highly exothermic process (releases huge heat)",
        keywords: ["exothermic", "heat", "thermal", "energy", "hot"],
        weight: 1.5,
      },
      {
        point: "Adding water to acid causes sudden local heating, splashing acid out",
        keywords: ["splash", "spurt", "boil", "burn", "steam", "explode"],
        weight: 1.5,
      },
      {
        point: "Adding acid to water allows the large volume of water to absorb the heat safely",
        keywords: ["absorb", "stir", "slowly", "dissipate", "volume", "glass", "crack"],
        weight: 1,
      },
    ],
    modelAnswer:
      "Dissolving a concentrated acid in water is highly exothermic. If water is added to concentrated acid, the sudden heat generated can convert the water into steam instantly, causing the acid mixture to splash out and cause severe burns or crack the glass beaker. Adding acid drop-by-drop to water with stirring lets the water safely absorb and distribute the heat.",
    examinerTip:
      "Always state the keyword 'highly exothermic' first, then mention splashing and glass breakage.",
    followUpQuestion: "How does the concentration of hydronium ions (H3O+) change when an acid is diluted?",
  },
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 6,
    chapterTitle: "Life Processes",
    difficulty: "medium",
    examinerContext: "Biology Practical Viva",
    question: "Why do ventricles of the human heart have thicker muscular walls than the atria?",
    hint: "Compare where atria pump blood versus where ventricles pump blood.",
    rubricPoints: [
      {
        point: "Atria only pump blood a short distance into the adjacent ventricles",
        keywords: ["atria", "auricle", "short", "ventricle", "below", "adjacent"],
        weight: 1,
      },
      {
        point: "Ventricles must pump blood under high pressure to the lungs and entire body",
        keywords: ["pressure", "body", "lungs", "organs", "distance", "far", "pump"],
        weight: 1.5,
      },
      {
        point: "Left ventricle is thickest because it pumps oxygenated blood to the whole body",
        keywords: ["left", "oxygenated", "aorta", "thickest", "systemic"],
        weight: 1,
      },
    ],
    modelAnswer:
      "Atria only need to push blood a very short distance down into the ventricles, so they have thin walls. In contrast, ventricles must pump blood under high pressure to distant organs—the right ventricle to the lungs and the left ventricle to the entire body—requiring thick, strong muscular walls.",
    examinerTip:
      "Bonus points if you specifically note that the left ventricle has the thickest wall of all four chambers!",
    followUpQuestion: "What prevents the backflow of blood inside the heart during contraction?",
  },
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 6,
    chapterTitle: "Life Processes",
    difficulty: "easy",
    examinerContext: "Biology Stomata Mount Viva",
    question: "What is the role of guard cells in stomata, and when do stomata usually open and close?",
    hint: "Think about water movement (turgidity) into and out of the bean-shaped cells.",
    rubricPoints: [
      {
        point: "Guard cells regulate the opening and closing of the stomatal pore",
        keywords: ["open", "close", "regulate", "control", "pore", "stomata"],
        weight: 1.5,
      },
      {
        point: "Water enters guard cells making them swell/turgid, opening the pore",
        keywords: ["water", "swell", "turgid", "expand", "open"],
        weight: 1.5,
      },
      {
        point: "When water leaves, guard cells shrink/become flaccid and the pore closes to prevent water loss",
        keywords: ["shrink", "flaccid", "transpiration", "loss", "close", "dry"],
        weight: 1,
      },
    ],
    modelAnswer:
      "Guard cells control the opening and closing of stomatal pores for gas exchange and transpiration. When water flows into guard cells, they swell and become turgid, curving outward to open the pore. When they lose water and shrink (become flaccid), the pore closes to conserve water.",
    examinerTip:
      "Using the terms 'turgid' (swollen) and 'flaccid' (shrunk) immediately signals thorough NCERT mastery.",
    followUpQuestion: "Why are stomata mostly located on the lower epidermis of dicot leaves?",
  },
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 10,
    chapterTitle: "Light - Reflection and Refraction",
    difficulty: "medium",
    examinerContext: "Physics Optics Viva",
    question: "Why do we prefer a convex mirror as a rear-view mirror in vehicles instead of a plane or concave mirror?",
    hint: "Think about image orientation (erect vs inverted) and field of view.",
    rubricPoints: [
      {
        point: "Always forms an erect (upright) and diminished image regardless of object distance",
        keywords: ["erect", "upright", "diminished", "smaller", "virtual"],
        weight: 1.5,
      },
      {
        point: "Curved outward surface provides a much wider field of view",
        keywords: ["wide", "wider", "field of view", "area", "traffic", "behind"],
        weight: 1.5,
      },
      {
        point: "Allows the driver to see more traffic safely behind the vehicle",
        keywords: ["driver", "traffic", "vehicles", "safe", "larger"],
        weight: 1,
      },
    ],
    modelAnswer:
      "A convex mirror is preferred as a rear-view mirror for two key reasons: first, it always produces a virtual, erect, and diminished image of vehicles behind, no matter how far they are; second, because it curves outward, it provides a much wider field of view than a plane mirror, helping the driver monitor more traffic.",
    examinerTip:
      "State both points clearly: (1) always erect & diminished image, and (2) wider field of view.",
    followUpQuestion: "What is the magnification sign and value range for a convex mirror?",
  },
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 12,
    chapterTitle: "Electricity",
    difficulty: "medium",
    examinerContext: "Physics Ohm's Law Lab Viva",
    question: "State Ohm's Law and explain why temperature must remain constant while verifying it in the lab.",
    hint: "How does temperature affect the resistance of a metallic conductor?",
    rubricPoints: [
      {
        point: "Current (I) is directly proportional to potential difference (V) across the ends of a conductor",
        keywords: ["current", "proportional", "potential", "voltage", "directly", "v = ir", "ir"],
        weight: 1.5,
      },
      {
        point: "Resistance (R) is the proportionality constant",
        keywords: ["resistance", "constant", "r"],
        weight: 1,
      },
      {
        point: "Changing temperature changes resistance of the wire, making the V-I graph non-linear",
        keywords: ["temperature", "resistance", "change", "increase", "linear", "straight", "heat"],
        weight: 1.5,
      },
    ],
    modelAnswer:
      "Ohm's Law states that the electric current flowing through a metallic conductor is directly proportional to the potential difference across its ends, provided temperature and other physical conditions remain constant (V = IR). If temperature rises, the resistance of the metal wire increases, so the V-I graph would curve instead of remaining a straight line.",
    examinerTip:
      "Don't forget the condition 'provided physical conditions like temperature remain constant' when stating Ohm's Law!",
    followUpQuestion: "How are an ammeter and a voltmeter connected in an Ohm's law circuit?",
  },
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 12,
    chapterTitle: "Electricity",
    difficulty: "hard",
    examinerContext: "Physics Circuits Viva",
    question: "Why are household electrical appliances connected in parallel rather than in series?",
    hint: "Think about voltage across each appliance, independent switching, and total resistance.",
    rubricPoints: [
      {
        point: "Each appliance gets the full 220V supply voltage independently",
        keywords: ["voltage", "same", "220", "potential", "equal", "full"],
        weight: 1.5,
      },
      {
        point: "Independent switches: if one appliance fails or is turned off, others keep working",
        keywords: ["independent", "switch", "fail", "fuse", "stop", "work", "other"],
        weight: 1.5,
      },
      {
        point: "Total equivalent resistance decreases, allowing proper current draw",
        keywords: ["resistance", "less", "decreases", "low", "current"],
        weight: 1,
      },
    ],
    modelAnswer:
      "Household circuits use parallel connections because: (1) every appliance receives the same full 220V supply voltage; (2) each device has its own independent switch, so if one bulb fuses, the rest continue working; and (3) overall circuit resistance decreases, allowing each appliance to draw the current it needs.",
    examinerTip:
      "Giving 3 crisp numbered reasons in a viva shows structured thinking and earns instant full marks.",
    followUpQuestion: "What happens to total resistance when more resistors are added in parallel?",
  },
  {
    schoolClass: "10",
    subject: "Science",
    chapterNo: 4,
    chapterTitle: "Carbon and its Compounds",
    difficulty: "medium",
    examinerContext: "Chemistry Carbon Viva",
    question: "Why does carbon form covalent bonds instead of ionic C4+ or C4- ions?",
    hint: "Consider the energy needed to remove 4 electrons and the stability of 6 protons holding 10 electrons.",
    rubricPoints: [
      {
        point: "Carbon has 4 valence electrons (atomic number 6, configuration 2,4)",
        keywords: ["four", "4", "valence", "atomic", "electrons"],
        weight: 1,
      },
      {
        point: "Gaining 4 electrons (C4-) is unstable because 6 protons cannot hold 10 electrons",
        keywords: ["gain", "6 protons", "10 electrons", "hold", "unstable", "repulsion"],
        weight: 1.5,
      },
      {
        point: "Losing 4 electrons (C4+) requires a huge amount of ionization energy",
        keywords: ["lose", "losing", "energy", "huge", "large", "remove"],
        weight: 1.5,
      },
      {
        point: "Therefore carbon shares electrons to form covalent bonds",
        keywords: ["share", "sharing", "covalent"],
        weight: 1,
      },
    ],
    modelAnswer:
      "Carbon has 4 valence electrons. It cannot gain 4 electrons to form C4- because it is very difficult for a nucleus with 6 protons to hold onto 10 electrons. It also cannot lose 4 electrons to form C4+ because removing four electrons requires an enormous amount of energy. Hence, carbon attains a noble gas configuration by sharing electrons through covalent bonds.",
    examinerTip:
      "Mention the exact numbers: 6 protons vs 10 electrons for C4-, and huge energy needed for C4+.",
    followUpQuestion: "What are the two unique properties of carbon that lead to millions of compounds?",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS (8 Questions)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    schoolClass: "10",
    subject: "Mathematics",
    chapterNo: 1,
    chapterTitle: "Real Numbers",
    difficulty: "easy",
    examinerContext: "Maths Board Viva",
    question: "State the Fundamental Theorem of Arithmetic and give one practical use of it.",
    hint: "Think about prime factors and uniqueness, plus HCF/LCM or irrationality proofs.",
    rubricPoints: [
      {
        point: "Every composite number can be expressed (factorised) as a product of primes",
        keywords: ["composite", "product", "prime", "factor", "factorised"],
        weight: 1.5,
      },
      {
        point: "This prime factorisation is unique apart from the order of the factors",
        keywords: ["unique", "order", "arrangement"],
        weight: 1.5,
      },
      {
        point: "Used to find HCF and LCM or prove numbers like sqrt(2) are irrational",
        keywords: ["hcf", "lcm", "irrational", "terminating", "proof"],
        weight: 1,
      },
    ],
    modelAnswer:
      "The Fundamental Theorem of Arithmetic states that every composite number can be expressed as a product of primes, and this factorisation is unique, apart from the order in which the prime factors occur. We use it to find the HCF and LCM of numbers and to prove that roots like √2 or √3 are irrational.",
    examinerTip:
      "Always include the phrase 'apart from the order in which the prime factors occur'—that's the key precision examiners check.",
    followUpQuestion: "What is the relationship between HCF, LCM, and the product of two positive integers a and b?",
  },
  {
    schoolClass: "10",
    subject: "Mathematics",
    chapterNo: 4,
    chapterTitle: "Quadratic Equations",
    difficulty: "medium",
    examinerContext: "Algebra Viva",
    question: "What is the discriminant of a quadratic equation ax² + bx + c = 0, and how does it determine the nature of roots?",
    hint: "Recall D = b² - 4ac and the three cases: D > 0, D = 0, D < 0.",
    rubricPoints: [
      {
        point: "Defines Discriminant D = b² - 4ac",
        keywords: ["b^2 - 4ac", "b2 - 4ac", "b square minus 4ac", "discriminant"],
        weight: 1.5,
      },
      {
        point: "D > 0 gives two distinct real roots; D = 0 gives two equal real roots",
        keywords: ["greater", "distinct", "equal", "real", "zero"],
        weight: 1.5,
      },
      {
        point: "D < 0 means no real roots exist",
        keywords: ["less", "negative", "no real", "imaginary"],
        weight: 1,
      },
    ],
    modelAnswer:
      "For ax² + bx + c = 0 (a ≠ 0), the discriminant is D = b² - 4ac. If D > 0, the equation has two distinct real roots; if D = 0, it has two equal real roots; and if D < 0, it has no real roots.",
    examinerTip:
      "Mention 'a ≠ 0' cleanly at the start—board examiners appreciate domain accuracy.",
    followUpQuestion: "What is the value of each root when D = 0?",
  },
  {
    schoolClass: "10",
    subject: "Mathematics",
    chapterNo: 6,
    chapterTitle: "Triangles",
    difficulty: "medium",
    examinerContext: "Geometry Practical Viva",
    question: "State the Basic Proportionality Theorem (Thales' Theorem) in your own words.",
    hint: "Draw a line parallel to one side of a triangle intersecting the other two sides.",
    rubricPoints: [
      {
        point: "A line is drawn parallel to one side of a triangle",
        keywords: ["parallel", "line", "side", "triangle"],
        weight: 1.5,
      },
      {
        point: "It intersects the other two sides at distinct points",
        keywords: ["intersect", "two sides", "distinct", "points"],
        weight: 1,
      },
      {
        point: "The other two sides are divided in the same ratio",
        keywords: ["same ratio", "equal ratio", "proportion", "divided"],
        weight: 1.5,
      },
    ],
    modelAnswer:
      "Thales' Theorem (BPT) states that if a line is drawn parallel to one side of a triangle to intersect the other two sides in distinct points, then the other two sides are divided in the same ratio.",
    examinerTip:
      "Keep the statement crisp: parallel to one side + intersects other two at distinct points + divides in the same ratio.",
    followUpQuestion: "What does the converse of BPT state?",
  },
  {
    schoolClass: "10",
    subject: "Mathematics",
    chapterNo: 8,
    chapterTitle: "Introduction to Trigonometry",
    difficulty: "easy",
    examinerContext: "Trigonometry Viva",
    question: "Why is sin θ never greater than 1 for an acute angle in a right-angled triangle?",
    hint: "Look at the ratio definition of sin θ and compare the sides of a right triangle.",
    rubricPoints: [
      {
        point: "sin θ = Opposite side (Perpendicular) / Hypotenuse",
        keywords: ["perpendicular", "opposite", "hypotenuse", "ratio"],
        weight: 1.5,
      },
      {
        point: "Hypotenuse is the longest side of a right-angled triangle",
        keywords: ["longest", "greater", "largest", "hypotenuse"],
        weight: 1.5,
      },
      {
        point: "Since numerator is always less than or equal to denominator, ratio ≤ 1",
        keywords: ["numerator", "denominator", "less", "never exceed", "1"],
        weight: 1,
      },
    ],
    modelAnswer:
      "In a right-angled triangle, sin θ is defined as the ratio of the perpendicular (opposite side) to the hypotenuse. Since the hypotenuse is always the longest side of a right triangle, the perpendicular can never exceed the hypotenuse—meaning sin θ is always less than or equal to 1.",
    examinerTip:
      "This is a classic viva trap! Remember: sec θ and cosec θ are ≥ 1, while sin θ and cos θ are ≤ 1.",
    followUpQuestion: "Can tan θ be greater than 1? Why?",
  },
  {
    schoolClass: "10",
    subject: "Mathematics",
    chapterNo: 10,
    chapterTitle: "Circles",
    difficulty: "easy",
    examinerContext: "Geometry Viva",
    question: "How many tangents can be drawn to a circle from a point outside it, and how are their lengths related?",
    hint: "Recall Theorem 10.2 about external tangents.",
    rubricPoints: [
      {
        point: "Exactly two tangents can be drawn from an external point",
        keywords: ["two", "2", "external", "outside"],
        weight: 1.5,
      },
      {
        point: "The lengths of the two tangents from an external point are equal",
        keywords: ["equal", "same length", "congruent"],
        weight: 1.5,
      },
      {
        point: "A tangent is always perpendicular to the radius at the point of contact",
        keywords: ["perpendicular", "90", "radius", "contact"],
        weight: 1,
      },
    ],
    modelAnswer:
      "From any point lying outside a circle, exactly two tangents can be drawn to the circle, and the lengths of these two tangent segments are always equal. Also, each tangent is perpendicular to the radius at the point of contact.",
    examinerTip:
      "State both: 'exactly two' and 'equal in length'. Mentioning perpendicularity to radius adds extra polish.",
    followUpQuestion: "How many tangents can be drawn from a point lying inside a circle?",
  },
  {
    schoolClass: "10",
    subject: "Mathematics",
    chapterNo: 14,
    chapterTitle: "Statistics",
    difficulty: "hard",
    examinerContext: "Statistics Viva",
    question: "What is the empirical relationship between Mean, Median, and Mode, and when is Median preferred over Mean?",
    hint: "Recall 3 Median = Mode + 2 Mean, and think about extreme outliers.",
    rubricPoints: [
      {
        point: "States empirical formula: 3 Median = Mode + 2 Mean",
        keywords: ["3 median", "mode + 2 mean", "2 mean", "three median"],
        weight: 2,
      },
      {
        point: "Median is preferred when data has extreme values or outliers",
        keywords: ["extreme", "outlier", "skewed", "unusual", "large", "small"],
        weight: 1.5,
      },
      {
        point: "Mean gets distorted by outliers, while Median represents the middle value",
        keywords: ["middle", "distort", "affect", "central"],
        weight: 1,
      },
    ],
    modelAnswer:
      "The empirical relationship for moderately skewed data is 3 Median = Mode + 2 Mean. Median is preferred over Mean when the dataset contains extreme values or outliers (like household incomes), because outliers heavily pull the Mean, whereas the Median stays anchored at the middle observation.",
    examinerTip:
      "Double-check the coefficients: 3 Median = 1 Mode + 2 Mean. Many students swap 3 and 2!",
    followUpQuestion: "Which measure of central tendency is best for finding the most popular shoe size in a store?",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOCIAL SCIENCE (8 Questions)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    schoolClass: "10",
    subject: "Social Science",
    chapterNo: 1,
    chapterTitle: "The Rise of Nationalism in Europe",
    difficulty: "medium",
    examinerContext: "History Board Viva",
    question: "What did 'Romanticism' mean in 19th-century Europe, and how did it help develop nationalist feelings?",
    hint: "Think beyond reason and science—focus on culture, folk songs, poetry, and shared heritage.",
    rubricPoints: [
      {
        point: "Romanticism was a cultural movement focusing on emotions, intuition, and mystical feelings",
        keywords: ["cultural", "emotion", "intuition", "feeling", "art", "poetry", "music"],
        weight: 1.5,
      },
      {
        point: "Criticised glorification of pure reason and science",
        keywords: ["reason", "science", "criticised"],
        weight: 1,
      },
      {
        point: "Used folk songs, folk dances, and vernacular language to create shared collective heritage",
        keywords: ["folk", "language", "heritage", "collective", "common", "past", "das volk"],
        weight: 1.5,
      },
    ],
    modelAnswer:
      "Romanticism was a cultural movement that sought to build nationalist sentiment through shared emotions, art, poetry, and music rather than pure reason and science. Thinkers like Johann Gottfried Herder collected folk songs, folk poetry, and vernacular traditions ('das volk') to unite people around a common cultural heritage.",
    examinerTip:
      "Mention 'cultural movement' and 'folk culture / vernacular language'—citing Herder or the Grimm Brothers makes your answer stand out.",
    followUpQuestion: "Who were Marianne and Germania in 19th-century Europe?",
  },
  {
    schoolClass: "10",
    subject: "Social Science",
    chapterNo: 2,
    chapterTitle: "Nationalism in India",
    difficulty: "easy",
    examinerContext: "History Viva",
    question: "Why did Mahatma Gandhi choose 'Salt' as the central symbol to launch the Civil Disobedience Movement in 1930?",
    hint: "Think about who consumed salt and how the British taxed and monopolised it.",
    rubricPoints: [
      {
        point: "Salt was consumed by both rich and poor alike—a universal essential item",
        keywords: ["rich", "poor", "everyone", "essential", "food", "common", "all"],
        weight: 1.5,
      },
      {
        point: "British government held a monopoly on salt production and imposed a tax on it",
        keywords: ["tax", "monopoly", "british", "oppressive", "government"],
        weight: 1.5,
      },
      {
        point: "It could unite all sections of Indian society across caste and religion",
        keywords: ["unite", "unity", "sections", "dandi", "march"],
        weight: 1,
      },
    ],
    modelAnswer:
      "Gandhi chose salt because it was an essential item of food consumed by rich and poor alike, making the British salt tax and production monopoly the most oppressive face of colonial rule. By targeting salt through the Dandi March, he found a powerful symbol capable of uniting all classes and communities of Indian society.",
    examinerTip:
      "Connect 'consumed by rich and poor alike' + 'British monopoly/tax' + 'united all classes'.",
    followUpQuestion: "How was the Civil Disobedience Movement different from the Non-Cooperation Movement?",
  },
  {
    schoolClass: "10",
    subject: "Social Science",
    chapterNo: 1,
    chapterTitle: "Power Sharing",
    difficulty: "medium",
    examinerContext: "Civics / Political Science Viva",
    question: "Distinguish between Prudential and Moral reasons for power sharing in a democracy.",
    hint: "Prudential = practical outcomes/stability; Moral = intrinsic democratic spirit.",
    rubricPoints: [
      {
        point: "Prudential reasons stress better outcomes like reducing social conflict and ensuring political stability",
        keywords: ["prudential", "outcome", "conflict", "stability", "violence", "practical"],
        weight: 1.5,
      },
      {
        point: "Moral reasons emphasise that power sharing is the very spirit of democracy",
        keywords: ["moral", "spirit", "right", "consulted", "legitimate", "democracy"],
        weight: 1.5,
      },
      {
        point: "Citizens have the right to be consulted on how they are governed",
        keywords: ["citizens", "governed", "stake", "voice"],
        weight: 1,
      },
    ],
    modelAnswer:
      "Prudential reasons are based on careful calculation of gains and losses—power sharing reduces the possibility of conflict between social groups and ensures political stability. Moral reasons hold that power sharing is the very spirit of democracy, where citizens have a fundamental right to be consulted on how they are governed.",
    examinerTip:
      "Pair them cleanly: Prudential → reduces conflict & brings stability; Moral → very spirit of democracy.",
    followUpQuestion: "Give one example of horizontal power sharing in India.",
  },
  {
    schoolClass: "10",
    subject: "Social Science",
    chapterNo: 1,
    chapterTitle: "Resources and Development",
    difficulty: "easy",
    examinerContext: "Geography Viva",
    question: "What is Sustainable Development, and why did the Rio de Janeiro Earth Summit (1992) adopt Agenda 21?",
    hint: "Think about meeting present needs without compromising future generations.",
    rubricPoints: [
      {
        point: "Development should take place without damaging the environment",
        keywords: ["environment", "damage", "harm", "protect", "ecology"],
        weight: 1.5,
      },
      {
        point: "Development in the present should not compromise the needs of future generations",
        keywords: ["future", "generations", "present", "needs", "compromise"],
        weight: 1.5,
      },
      {
        point: "Agenda 21 aims at achieving global sustainable development by combating environmental damage and poverty",
        keywords: ["agenda 21", "global", "poverty", "disease", "cooperation"],
        weight: 1,
      },
    ],
    modelAnswer:
      "Sustainable development means development should take place without damaging the environment, and development in the present should not compromise the needs of future generations. At the 1992 Rio Earth Summit, world leaders adopted Agenda 21 to achieve global sustainable development through international cooperation against environmental damage, poverty, and disease.",
    examinerTip:
      "The exact NCERT definition has two halves: (1) without damaging environment, (2) without compromising future generations.",
    followUpQuestion: "What is the difference between renewable and non-renewable resources?",
  },
  {
    schoolClass: "10",
    subject: "Social Science",
    chapterNo: 3,
    chapterTitle: "Money and Credit",
    difficulty: "medium",
    examinerContext: "Economics Viva",
    question: "Why do lenders ask for collateral while giving a loan, and why are formal sector loans better for poor borrowers?",
    hint: "Think about security against default, interest rates, and RBI supervision.",
    rubricPoints: [
      {
        point: "Collateral is an asset owned by the borrower used as a guarantee until the loan is repaid",
        keywords: ["asset", "guarantee", "security", "repaid", "sell", "property", "land"],
        weight: 1.5,
      },
      {
        point: "If the borrower fails to repay, the lender has the right to sell the asset to recover money",
        keywords: ["fail", "default", "recover", "sell"],
        weight: 1,
      },
      {
        point: "Formal sector (banks/cooperatives) offers lower interest rates and is supervised by the RBI, preventing debt traps",
        keywords: ["rbi", "interest", "low", "cheaper", "debt trap", "exploitation", "bank"],
        weight: 1.5,
      },
    ],
    modelAnswer:
      "Collateral is an asset (like land, building, or deposits) that the borrower owns and pledges as a guarantee to the lender until the loan is repaid; if the borrower defaults, the lender can sell it to recover the money. Formal sector loans from banks and cooperatives are much better because they charge reasonable, lower interest rates and are supervised by the RBI, protecting borrowers from unfair exploitation and debt traps.",
    examinerTip:
      "Always mention RBI supervision and lower interest rates when comparing formal vs informal credit.",
    followUpQuestion: "How do Self-Help Groups (SHGs) help rural women get loans without collateral?",
  },
  {
    schoolClass: "10",
    subject: "Social Science",
    chapterNo: 4,
    chapterTitle: "Globalisation and the Indian Economy",
    difficulty: "medium",
    examinerContext: "Economics Viva",
    question: "What is Globalisation, and what two major factors have enabled it rapidly in recent decades?",
    hint: "Think about integration between countries and improvements in tech & trade policies.",
    rubricPoints: [
      {
        point: "Rapid integration or interconnection between countries through trade and investments",
        keywords: ["integration", "interconnection", "countries", "trade", "investment", "mnc"],
        weight: 1.5,
      },
      {
        point: "Rapid improvement in technology (transport and IT/telecommunications)",
        keywords: ["technology", "transport", "internet", "communication", "it", "container"],
        weight: 1.5,
      },
      {
        point: "Liberalisation of foreign trade and investment policies (removing trade barriers)",
        keywords: ["liberalisation", "barrier", "tax", "quota", "policy", "open"],
        weight: 1.5,
      },
    ],
    modelAnswer:
      "Globalisation is the process of rapid integration or interconnection between countries, driven largely by MNCs moving goods, services, investments, and technology across borders. Two major factors enabling it are: (1) rapid improvements in transportation and information/communication technology, and (2) liberalisation of foreign trade and investment policies by removing trade barriers.",
    examinerTip:
      "Remember the two big enablers: Technology + Liberalisation (removing trade barriers).",
    followUpQuestion: "What is a trade barrier, and why did India use trade barriers after Independence?",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGLISH (Class X)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    schoolClass: "10",
    subject: "English",
    chapterNo: 3,
    chapterTitle: "A Letter to God",
    difficulty: "easy",
    examinerContext: "English Literature Voice Check",
    question: "Explain the irony at the end of 'A Letter to God' when Lencho counts the money.",
    hint: "Compare who actually sent the 70 pesos with whom Lencho blamed.",
    rubricPoints: [
      {
        point: "The postmaster and staff donated 70 pesos out of kindness to protect Lencho's faith",
        keywords: ["postmaster", "employees", "staff", "donated", "kind", "70"],
        weight: 1.5,
      },
      {
        point: "Lencho believed God sent 100 pesos and accused the post office staff of stealing 30 pesos",
        keywords: ["crooks", "steal", "stole", "30", "accused", "blamed"],
        weight: 1.5,
      },
      {
        point: "This creates situational irony because he distrusts his very helpers",
        keywords: ["irony", "ironic", "helped", "helpers"],
        weight: 1,
      },
    ],
    modelAnswer:
      "The ending is deeply ironic because the postmaster and post office employees collected 70 pesos from their own salaries to keep Lencho's faith alive, yet Lencho suspected them of stealing the remaining 30 pesos and called his own helpers a bunch of crooks.",
    examinerTip:
      "Use the phrase 'situational irony' and mention both numbers: 70 pesos donated and 30 pesos suspected missing.",
    followUpQuestion: "Why did the postmaster decide to answer Lencho's letter?",
  },
  {
    schoolClass: "10",
    subject: "English",
    chapterNo: 4,
    chapterTitle: "Nelson Mandela: Long Walk to Freedom",
    difficulty: "medium",
    examinerContext: "English Prose Check",
    question: "Why did Nelson Mandela say that both the oppressor and the oppressed need to be liberated?",
    hint: "Think about what hatred takes away from the person who imprisons another.",
    rubricPoints: [
      {
        point: "The oppressed is robbed of freedom and dignity",
        keywords: ["oppressed", "freedom", "dignity", "victim"],
        weight: 1,
      },
      {
        point: "The oppressor is a prisoner of hatred, prejudice, and narrow-mindedness",
        keywords: ["oppressor", "hatred", "prisoner", "prejudice", "narrow"],
        weight: 1.5,
      },
      {
        point: "Taking away someone else's freedom robs the oppressor of their own humanity",
        keywords: ["humanity", "robbed", "free"],
        weight: 1.5,
      },
    ],
    modelAnswer:
      "Mandela believed the oppressor must be liberated just as surely as the oppressed because a person who takes away another's freedom becomes a prisoner of hatred and prejudice, losing their own humanity in the process.",
    examinerTip:
      "Key phrase to include: 'a prisoner of hatred' and 'robbed of humanity'.",
    followUpQuestion: "What does Mandela mean by 'courage is the triumph over fear'?",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HINDI (Class X)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    schoolClass: "10",
    subject: "Hindi",
    chapterNo: 9,
    chapterTitle: "नेताजी का चश्मा",
    difficulty: "easy",
    examinerContext: "Hindi Literature Check",
    question: "Explain the message behind 'Netaji ka Chashma' and why children put a sarkanda spectacles frame on the statue at the end.",
    hint: "Think about everyday patriotism passing from Captain to the younger generation.",
    rubricPoints: [
      {
        point: "Patriotism is shown through small, sincere everyday actions by ordinary citizens",
        keywords: ["patriotism", "deshbhakti", "ordinary", "citizens", "small", "captain"],
        weight: 1.5,
      },
      {
        point: "After Captain's death, children placed a handmade sarkanda (reed) frame on Netaji's statue",
        keywords: ["children", "sarkanda", "reed", "statue", "death", "frame"],
        weight: 1.5,
      },
      {
        point: "This proves patriotism and respect for freedom fighters remain alive in the next generation",
        keywords: ["generation", "alive", "future", "hope", "respect"],
        weight: 1,
      },
    ],
    modelAnswer:
      "The story shows that true patriotism lives in ordinary citizens like Captain Chashmewala who respected Netaji in his own humble way. Even after Captain passed away, local children put a handmade sarkanda reed spectacles frame on the statue, proving that love and respect for national heroes remain alive in India's younger generation.",
    examinerTip:
      "Mention the 'sarkanda' reed glasses placed by children—that moment fills Haldar Sahib's eyes with tears of pride.",
    followUpQuestion: "Why did Haldar Sahib initially feel disappointed when he saw the statue without a real marble pair of glasses?",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INFORMATION TECHNOLOGY (Class X)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    schoolClass: "10",
    subject: "Information Technology",
    chapterNo: 4,
    chapterTitle: "Database Management",
    difficulty: "medium",
    examinerContext: "IT / DBMS Viva",
    question: "What is the difference between a Primary Key and a Foreign Key in a relational database?",
    hint: "Think about unique row identification within one table vs linking two tables together.",
    rubricPoints: [
      {
        point: "Primary Key uniquely identifies each record in a table and cannot be NULL or duplicate",
        keywords: ["unique", "uniquely", "null", "duplicate", "record", "row", "primary"],
        weight: 1.5,
      },
      {
        point: "Foreign Key links one table to the Primary Key of another table",
        keywords: ["link", "reference", "another table", "foreign", "connect"],
        weight: 1.5,
      },
      {
        point: "Maintains referential integrity across related tables",
        keywords: ["integrity", "referential", "relationship"],
        weight: 1,
      },
    ],
    modelAnswer:
      "A Primary Key is a column (or combination of columns) that uniquely identifies every row in its own table and can never contain NULL or duplicate values. A Foreign Key is a column in another table that refers back to that Primary Key to connect the two tables and preserve referential integrity.",
    examinerTip:
      "Say 'unique and NOT NULL' for Primary Key, and 'references another table's Primary Key for referential integrity' for Foreign Key.",
    followUpQuestion: "Can a table have more than one Foreign Key?",
  },
  {
    schoolClass: "10",
    subject: "Information Technology",
    chapterNo: 3,
    chapterTitle: "Electronic Spreadsheet",
    difficulty: "easy",
    examinerContext: "IT Spreadsheet Check",
    question: "When would you use Goal Seek instead of a regular formula in a spreadsheet?",
    hint: "Think about knowing the desired final score/target and finding the missing input.",
    rubricPoints: [
      {
        point: "Regular formulas calculate output from known inputs",
        keywords: ["formula", "output", "input", "forward"],
        weight: 1,
      },
      {
        point: "Goal Seek works backward from a desired target output to find the needed input value",
        keywords: ["backward", "target", "desired", "result", "goal", "reverse"],
        weight: 2,
      },
    ],
    modelAnswer:
      "A regular formula calculates an output when all inputs are known. Goal Seek works in reverse: when you already know the exact target result you want in a formula cell—like needing 85% overall—Goal Seek automatically calculates what input value in one changing cell will reach that goal.",
    examinerTip:
      "Contrast 'forward calculation (formula)' with 'backward target-seeking (Goal Seek)'.",
    followUpQuestion: "What is the main difference between Goal Seek and Solver?",
  },
];
