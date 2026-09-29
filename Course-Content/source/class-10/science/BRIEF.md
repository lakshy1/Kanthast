# Kanthast School — Class X Science video scripts: writer brief

Kanthast School is an Indian edtech app (CBSE/NCERT, Classes I–X) whose selling point is short, animated, cartoon-style lessons. You are writing production scripts for **Class X Science** (NCERT 2023-24 rationalised textbook). Each row = one short animated video on one sub-topic.

## Recurring cast (use in every script, keep consistent)
- **NEO** — the guide. A round, cheerful cartoon owl in a lab coat with oversized goggles pushed up on the forehead. Calm, witty, explains clearly.
- **ZIPPY** — the sidekick. A small, bouncy electric-blue spark with big eyes. Curious, impatient, asks the questions a Class 10 student would ask, sometimes gets things wrong so Neo can correct the misconception.
- Occasional walk-ons are fine (a talking test tube, a grumpy rust flake, a neuron with headphones) if they help the concept.

## Tone and level
- Audience: 15–16 year olds preparing for CBSE boards. Cartoonish and fun, but NOT babyish. Humour comes from the visuals and Zippy, while the science stays exact.
- Indian everyday examples where natural (chai, curd, Diwali lights, cricket, pressure cooker, monsoon, school lab).
- Every fact, formula, unit, sign convention, example and equation must match the NCERT Class 10 Science textbook. Balanced equations must actually balance. No content beyond the syllabus unless flagged as "fun fact".
- Include one short **board-exam tip** in each video where it fits (common mistake, frequently asked question, diagram marks).

## Short and crisp
- Target **2 to 3.5 minutes** per video. That means **240–420 spoken words total** across all lines (narration pace is ~130 words/min). Hard cap 450 words spoken.
- 5–7 scenes. Scene 1 = a hook (a funny or surprising situation). The last scene = a 3-point recap (spoken by Neo), with the recap points shown on screen.
- One idea per sentence. No filler.

## Animation descriptions
Each scene's `animation` field is a direction for the animator: what is on screen, what moves, the on-screen text/labels/equations, colour cues, transitions. 1–3 sentences, concrete (e.g. "Split screen: left beaker turns milky as CO2 bubbles in; label 'CaCO3 ↓' pops up with a bounce."). Diagrams that NCERT expects students to draw should be animated being built step by step and labelled.

## Output format (STRICT)
Write ONE JSON file per chapter to the path you are given: `ch<NN>.json` (NN = two-digit chapter number, e.g. `ch03.json`). UTF-8. The file is a JSON array of topic objects, in teaching order:

```json
[
  {
    "chapter_no": 11,
    "chapter": "Electricity",
    "topic_no": 1,
    "name": "Electric Current and Circuit",
    "scenes": [
      {
        "animation": "A dark room; Zippy flicks a switch and a bulb lights up. Camera zooms into the wire, where cartoon electrons shuffle along like a queue at a ticket counter.",
        "lines": [
          { "speaker": "ZIPPY", "text": "Whoa! How does the bulb know I pressed the switch?" },
          { "speaker": "NEO", "text": "It doesn't. The switch just completes the path, so charge can finally flow." }
        ]
      }
    ]
  }
]
```

Rules: `speaker` is one of NEO, ZIPPY or another named character in CAPS. `text` is only the spoken words (no stage directions in it). Validate that each file parses as JSON before you finish (e.g. `node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" <file>`). Do not write any other files.
