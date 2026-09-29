"""Sanity-check a class's script JSON before building: structure, numbering, length.

Usage: py -3.12 validate.py 10
"""
import json
import sys
from pathlib import Path

MIN_WORDS, MAX_WORDS = 220, 450

source = Path(__file__).parent / "source" / f"class-{sys.argv[1]}"
problems = 0
for folder in sorted(p for p in source.iterdir() if p.is_dir()):
    files = sorted(folder.glob("ch*.json"))
    count = 0
    for path in files:
        try:
            topics = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            print(f"  BAD JSON {path.name}: {exc}")
            problems += 1
            continue
        expected_no = int(path.stem[2:])
        for i, t in enumerate(topics, 1):
            count += 1
            words = sum(len(l["text"].split()) for s in t["scenes"] for l in s["lines"])
            issues = []
            if t["chapter_no"] != expected_no:
                issues.append(f"chapter_no {t['chapter_no']} != file {expected_no}")
            if t["topic_no"] != i:
                issues.append(f"topic_no {t['topic_no']} != {i}")
            if not 5 <= len(t["scenes"]) <= 7:
                issues.append(f"{len(t['scenes'])} scenes")
            if not MIN_WORDS <= words <= MAX_WORDS:
                issues.append(f"{words} words")
            if any(not s.get("animation") or not s.get("lines") for s in t["scenes"]):
                issues.append("empty scene")
            if issues:
                problems += 1
                print(f"  {folder.name}/{path.name} {t['topic_no']} {t['name']}: {', '.join(issues)}")
    print(f"{folder.name}: {len(files)} chapters, {count} topics")
print("OK" if not problems else f"{problems} problem(s)")
