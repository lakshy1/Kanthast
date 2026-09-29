# Kanthast School — Class X video scripts: writer brief (all subjects)

Kanthast School is an Indian edtech app (CBSE/NCERT, Classes I–X) whose selling point is short, animated, cartoon-style lessons. You are writing production scripts for **Class X** following the current **NCERT 2023-24 rationalised textbooks and the CBSE 2025-26 syllabus**. Each topic object = one short animated video on one sub-topic.

The Science set in `science/` is already done and is the reference for quality and format — open `science/ch11.json` and `science/ch02.json` and match them.

## Recurring cast (use in every script, keep consistent)
- **NEO** — the guide. A round, cheerful cartoon owl in a lab coat with oversized goggles pushed up on the forehead. Calm, witty, explains clearly.
- **ZIPPY** — the sidekick. A small, bouncy electric-blue spark with big eyes. Curious, impatient, asks the questions a Class 10 student would ask, sometimes gets things wrong so Neo can correct the misconception.
- Subject-appropriate walk-ons are fine (a talking protractor, a grumpy colonial-era ledger, a character from the story being studied) if they help the concept.

## Tone and level
- Audience: 15–16 year olds preparing for CBSE boards. Cartoonish and fun, but NOT babyish. Humour comes from the visuals and Zippy, while the content stays exact.
- Indian everyday examples where natural (chai, cricket, Diwali, monsoon, kirana shop, school canteen).
- Every fact, date, formula, definition, theorem, map location and quotation must match the NCERT Class 10 textbook. Worked examples must be arithmetically correct — re-check every number. No content beyond the syllabus unless flagged as "fun fact".
- Include one short **board-exam tip** in each video where it fits (common mistake, frequently asked question, marking-scheme point, map-work item).

## Short and crisp
- Target **2 to 3.5 minutes** per video: **240–420 spoken words total** across all lines (~130 words/min). Hard cap 450 spoken words.
- 5–7 scenes. Scene 1 = a hook (a funny or surprising situation). The last scene = a 3-point recap spoken by Neo, with the points shown on screen (Zippy may add a one-line quip after).
- One idea per sentence. No filler.

## Animation descriptions
Each scene's `animation` field is a direction for the animator: what is on screen, what moves, on-screen text/labels/equations/maps/timelines, colour cues, transitions. 1–3 sentences, concrete. Anything NCERT expects students to draw, derive or locate (constructions, proofs step-by-step, map items, timelines, flowcharts) should be animated being built step by step. `animation` is always written in **English** (it is for the animation team), even for Hindi videos.

## Output format (STRICT)
Write ONE JSON file per chapter to the folder you are given: `ch<NN>.json` (NN = two-digit chapter number you are given). UTF-8, no BOM. The file is a JSON array of topic objects, in teaching order:

```json
[
  {
    "chapter_no": 4,
    "chapter": "Quadratic Equations",
    "topic_no": 1,
    "name": "What Is a Quadratic Equation?",
    "scenes": [
      {
        "animation": "A cricket ball arcs across a stadium; its path freezes into a glowing parabola labelled 'y = ax² + bx + c'.",
        "lines": [
          { "speaker": "ZIPPY", "text": "Why does every six look like a smile in the sky?" },
          { "speaker": "NEO", "text": "Because the ball follows a quadratic path. Let's meet the equation behind it." }
        ]
      }
    ]
  }
]
```

Rules: `chapter_no`, `chapter`, `topic_no` exactly as assigned; `topic_no` runs 1..n within the chapter. `speaker` is NEO, ZIPPY or another named character in CAPS (Latin letters). `text` is only the spoken words (no stage directions). Validate every file parses (`node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" <file>`) and that each topic is 240–450 spoken words. Do not write any other files.
