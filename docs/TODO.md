# Spanish Escape Room – Build Roadmap (Cursor-led)

> Protocol:
> • Work phase-by-phase and STOP after each phase until I say “NEXT”.
> • Plain HTML/CSS/JS only; UK spellings; GitHub Pages compatible.

## Phase 0 — Project scaffold
- [ ] Create:
  / (root)
  index.html
  styles.css
  app.js
  README.md
  /assets/
  /content/

- [ ] index.html includes <main id="app"></main> and links CSS/JS with RELATIVE paths.
**Acceptance:** Opening index.html (or Cursor preview) shows an “Escape to Spain” shell; no console errors.

## Phase 1 — Import Question Pack (+ fallback)
- [ ] Create /content/questions.json and paste JSON from **APPENDIX A – Question Pack**.
- [ ] Add loader in app.js to fetch './content/questions.json'.
- [ ] Add the SAME JSON as inline fallback in index.html:
    <script type="application/json" id="qdata">…same JSON…</script>
    If fetch fails (local file), read from #qdata.
- [ ] Log mode labels and item counts to console.
**Acceptance:** App loads questions (file or fallback) and logs parsed counts.

## Phase 2 — Mode select + basic engine (MCQ + TF)
- [ ] Landing with two large buttons: “Years 2–3 (Visual)” and “Years 4–6 (Standard)”.
- [ ] Render a question sequence for the chosen mode.
- [ ] Support question types: mcq and tf with instant feedback + retry on wrong answers.
- [ ] Progress bar; tap targets ≥ 44px.
**Acceptance:** Both modes playable end-to-end with MCQ/TF; no layout overflow on iPad.

## Phase 3 — Finish flow (Boarding Pass)
- [ ] When all answers in the mode are correct, show a Boarding Pass with today’s date and “DXB → Spain”.
- [ ] Buttons: Restart (current mode) and Switch mode.
- [ ] Prevent bypass via URL/hash.
**Acceptance:** Boarding Pass appears only after all correct; controls work reliably.

## Phase 4 — Accessibility + persistence
- [ ] Semantic landmarks, basic ARIA, visible focus, WCAG AA contrast.
- [ ] Persist chosen mode + per-mode progress in localStorage (refresh keeps them).
**Acceptance:** Keyboard/touch journeys OK; refresh preserves state.

## Phase 5 — README + GitHub Pages
- [ ] Write README.md explaining:
    1) how to edit /content/questions.json,
    2) how to add images to /assets/,
    3) how to reset progress (clear localStorage),
    4) how to deploy to GitHub Pages (Settings → Pages → Deploy from branch → main, root).
- [ ] Verify relative paths; no external CDNs; no post-load network calls.
**Acceptance:** A non-technical teacher can change questions and redeploy; live URL works.

## QA Checklist (tick before sign-off)
- [ ] No console errors.
- [ ] Plays end-to-end in both modes on iPad Safari.
- [ ] All assets local (<200KB each).
- [ ] All content editable via /content/questions.json.

---

APPENDIX A – QUESTION PACK (copy into /content/questions.json)

{
"meta": { "title": "Escape to Spain", "version": "1.0.0" },
"modes": {
  "y2_3": {
    "label": "Years 2–3 (Visual)",
    "items": [
      { "type": "mcq", "prompt": "Where is Spain?", "choices": ["Europe","America","Asia"], "answer": 0, "explain": "Spain is in Europe." },
      { "type": "mcq", "prompt": "Tap the Spanish word that means “Spanish”.", "choices": ["Español","Français","Deutsch","Italiano"], "answer": 0 },
      { "type": "mcq", "prompt": "Which food is from Spain?", "choices": ["Paella","Burger","Sushi","Pizza"], "answer": 0 },
      { "type": "tf",  "prompt": "Spain is in Africa", "answer": false, "explain": "Africa is a different continent." },
      { "type": "mcq", "prompt": "What is the capital of Spain?", "choices": ["Madrid","Barcelona","Valencia","Granada"], "answer": 0 },
      { "type": "mcq", "prompt": "Which football team is from Spain?", "choices": ["Real Madrid","Manchester United","PSG","Juventus"], "answer": 0 }
    ]
  },
  "y4_6": {
    "label": "Years 4–6 (Standard)",
    "items": [
      { "type": "mcq", "prompt": "Spain is in…", "choices": ["Asia","Africa","Europe"], "answer": 2 },
      { "type": "tf",  "prompt": "There are 17 countries in Spain", "answer": false, "explain": "Spain has 17 autonomous communities, not countries." },
      { "type": "mcq", "prompt": "Which of these is NOT a language spoken in Spain?", "choices": ["Spanish","Catalan","French","Basque"], "answer": 2 },
      { "type": "mcq", "prompt": "Which city celebrates San Fermín (running of the bulls)?", "choices": ["Madrid","Valencia","Pamplona","Seville"], "answer": 2 },
      { "type": "mcq", "prompt": "Which food is traditional in Spain?", "choices": ["Paella","Pizza","Sushi","Hot dog"], "answer": 0 },
      { "type": "mcq", "prompt": "Who painted surrealist artworks?", "choices": ["Salvador Dalí","Antonio Banderas","Fernando Alonso","Rosalía"], "answer": 0 },
      { "type": "tf",  "prompt": "People in Spain eat grapes at midnight on New Year’s Eve", "answer": true, "explain": "They eat 12 grapes at midnight for good luck." }
    ]
  }
}
}

APPENDIX B – INLINE FALLBACK (for local testing)
If the browser blocks fetch from local files, also embed the SAME JSON in index.html:
<script type="application/json" id="qdata">
<!-- paste the exact same JSON from /content/questions.json here -->
</script>
In app.js: try fetch('./content/questions.json'); on failure, parse JSON from #qdata.


