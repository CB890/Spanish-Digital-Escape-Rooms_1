## Spanish Digital Escape Room (Static)

A teacher-friendly Spanish culture digital escape room that runs on GitHub Pages. Built with plain HTML/CSS/JS (no frameworks, no external CDNs). Uses UK English spellings.

### Quick start
- Open `index.html` locally (double-click) or serve via GitHub Pages.
- Works offline after the first load; all assets are local with relative paths.
- Two modes in one app: Years 2–3 (Visual) and Years 4–6 (Standard).

### Edit the questions (teacher-only)
- Edit the single file: `content/questions.json`.
- Do not change any other files for content updates.
- Structure overview:

```json
{
  "meta": { "title": "Escape to Spain", "version": "1.0.0" },
  "modes": {
    "y2_3": {
      "label": "Years 2–3 (Visual)",
      "settings": { "advanceOnAnyAnswer": true },
      "items": [
        { "type": "mcq", "prompt": "Tap the Spanish flag", "choices": ["🇪🇸","🇫🇷","🇩🇪","🇮🇹"], "answer": 0 },
        { "type": "mcq-image", "prompt": "Where is this monument?", "image": "assets/sagrada-familia.jpg", "choices": ["Barcelona","Paris","Dubai","New York"], "answer": 0 }
      ]
    },
    "y4_6": {
      "label": "Years 4–6 (Standard)",
      "settings": { "advanceOnAnyAnswer": true },
      "items": [
        { "type": "tf", "prompt": "Spain is in Europe", "answer": true, "explain": "Europe is Spain’s continent." }
      ]
    }
  }
}
```

- Question types supported:
  - `mcq`: multiple-choice. Fields: `prompt` (string), `choices` (array of strings), `answer` (number index, 0-based), optional `explain` (string).
  - `tf`: true/false. Fields: `prompt` (string), `answer` (boolean), optional `explain` (string).
  - `mcq-image`: image-led multiple-choice. Fields: `prompt`, `image` (path in `assets/`), `choices` (array of strings), `answer` (number), optional `alt` (string for image alt text). If the image is missing, an emoji tile is shown and a console warning is logged.
- Keep the JSON valid (commas, quotes). If unsure, validate with an online JSON checker before pasting.

### Adding images
- Save files in `assets/` (e.g., `assets/paella.jpg`, `assets/sagrada-familia.jpg`, `assets/flag-spain.png`).
- Reference them from `content/questions.json` using the `image` field, for example:

```json
{ "type": "mcq-image", "prompt": "Which food is from Spain?", "image": "assets/paella.jpg", "choices": ["Paella","Burger","Sushi","Pizza"], "answer": 0 }
```

- Alt-text defaults to the `prompt` unless you add an explicit `alt` field.
- If an image file is missing, the app uses an emoji placeholder and logs a console warning. Keep images ≤200KB where possible.

### Advance on any answer (setting)
- To allow pupils to move on whether they are right or wrong, set per mode:

```json
"settings": { "advanceOnAnyAnswer": true }
```

- Default is true for both modes. When enabled, a “Next” button appears after any selection. Pupils can change their selection before pressing “Next”. Correct answers still count towards completion.

### Hints after wrong attempts
- You can show a short hint automatically after a number of wrong tries.
- At mode level, set (default 2):

```json
"settings": { "attemptsBeforeHint": 2 }
```

- At item level, add a `hint`:

```json
{ "type": "mcq", "prompt": "Tap the Spanish flag", "choices": ["🇪🇸","🇫🇷","🇩🇪","🇮🇹"], "answer": 0, "hint": "Look for red and yellow with a crest." }
```

- Pupils see “Hint: …” after they reach the threshold on that question. This works with both `mcq` and `tf`, and also `mcq-image`.

### Reset pupil progress
Progress is saved in the browser’s `localStorage` to keep the chosen mode and progress per device.

Options to reset:
- Use the browser’s site data controls (recommended):
  - Chrome: Settings → Privacy & security → Site settings → View permissions and data stored → Clear data for your site.
  - Safari iPad: Settings → Safari → Advanced → Website Data → Remove data for your site.
- Or run this in the browser console on the page, then refresh:

```js
localStorage.removeItem('escape_es_state_v1');
location.reload();
```

### Saving and printing the boarding pass
- Save as PNG: On the finish screen, click “Save as PNG”. A file named `boarding-pass.png` downloads showing the ticket + stub only.
- Print: Click “Print ticket”. A print stylesheet hides page chrome and prints just the ticket, centred. Works on A4 (and scales down well to A6).
- Passenger name: Enter a pupil name on the ticket; it is saved locally and will appear next time on the same device.
- Airline (name/logo):
  - Default airline name is “Dubai British School Air”. To change it, set `meta.airline` in `content/questions.json`:

```json
"meta": { "airline": "Dubai British School Air" }
```

  - Place a custom SVG at `assets/logo-airline.svg` (recommended height ~32px, width ≤120px). If the logo file is missing, the ticket shows the text fallback with the airline name.

### Deploy to GitHub Pages
1) Commit and push all files to the `main` branch of your repository.
2) In GitHub: Settings → Pages.
3) Under “Build and deployment” set:
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/ (root)`
4) Save. Wait ~1–2 minutes for the Pages build.
5) Open the published URL shown on the Pages screen. The app should load with all relative paths working.

Notes:
- No external network calls occur after load; everything is served locally from your repository.
- If you ever see a blank page locally due to blocked `fetch` of local files, this app also embeds a fallback copy of the questions inside `index.html`, so it should still work offline when opened directly.

### Accessibility and devices
- Semantic landmarks, visible focus, and large tap targets (≥44px) are included.
- Designed for iPad Safari and desktop browsers.

### Project structure
- `index.html` — App entry; contains an inline fallback of the question pack.
- `styles.css` — Accessible styles with high-contrast defaults.
- `app.js` — Quiz engine, mode selection, persistence, boarding pass.
- `content/questions.json` — The only file you edit for content.
- `assets/` — Place your images here (optional).
- `docs/TODO.md` — Build roadmap and acceptance criteria.


