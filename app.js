// Spanish Digital Escape Room — App shell (Phase 0)
// Plain JS, no frameworks. UK English spellings.

(function () {
  'use strict';

  /**
   * Render a minimal shell so teachers and pupils see something while
   * we build out phases. This should not error even when offline.
   */
  function renderShell() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '' +
      '<section class="card shell" aria-labelledby="welcome-title">' +
      '  <h2 id="welcome-title">Welcome</h2>' +
      '  <p class="muted">A Spanish culture digital escape room.</p>' +
      '  <button class="cta" type="button" aria-label="Start placeholder" disabled>' +
      '    🚧 Building… (awaiting questions)' +
      '  </button>' +
      '</section>';
  }

  function parseInlineFallback() {
    try {
      var node = document.getElementById('qdata');
      if (!node) return null;
      var text = node.textContent || node.innerText || '';
      return JSON.parse(text);
    } catch (e) {
      console.warn('Inline fallback parse failed:', e);
      return null;
    }
  }

  function loadQuestions() {
    // Try to fetch local JSON; if blocked (e.g., file://), fall back to inline.
    return fetch('./content/questions.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function () {
        return parseInlineFallback();
      });
  }

  function logModeCounts(data) {
    if (!data || !data.modes) return;
    var modes = data.modes;
    Object.keys(modes).forEach(function (key) {
      var label = modes[key].label || key;
      var count = Array.isArray(modes[key].items) ? modes[key].items.length : 0;
      console.log('[Questions]', label + ': ' + count + ' items');
    });
  }

  // Phase 2: Simple quiz engine (MCQ + True/False)
  var state = {
    data: null,
    modeKey: null,
    index: 0,
    correctSet: {},
    selected: null,
    wrongAttempts: {},
    visitedSet: {}
  };

  var imageStatus = {}; // { url: 'ok' | 'missing' }

  function renderLanding(data) {
    var app = document.getElementById('app');
    var y23 = data.modes.y2_3;
    var y46 = data.modes.y4_6;
    app.innerHTML = '' +
      '<section class="card" aria-labelledby="mode-title">' +
      '  <h2 id="mode-title">Choose your mode</h2>' +
      '  <div class="mode-grid" role="group" aria-label="Difficulty modes">' +
      '    <button class="mode-btn" data-mode="y2_3" aria-label="Years 2 to 3 Visual">👧👦 ' + escapeHtml(y23.label) + '</button>' +
      '    <button class="mode-btn" data-mode="y4_6" aria-label="Years 4 to 6 Standard">🧑‍🎓 ' + escapeHtml(y46.label) + '</button>' +
      '  </div>' +
      '</section>';

    var buttons = app.querySelectorAll('.mode-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-mode');
        startMode(key);
      });
    });
  }

  function startMode(modeKey) {
    state.modeKey = modeKey;
    state.index = 0;
    state.correctSet = {};
    state.wrongAttempts = {};
    state.visitedSet = {};
    renderQuestion();
  }

  function getCurrentItem() {
    var items = state.data.modes[state.modeKey].items;
    return items[state.index];
  }

  function renderProgress() {
    var items = state.data.modes[state.modeKey].items;
    var answered = Object.keys(state.correctSet).length;
    var pct = Math.round((answered / items.length) * 100);
    return '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Progress"><div class="bar" style="width:' + pct + '%"></div></div>';
  }

  function renderQuestion() {
    var app = document.getElementById('app');
    var mode = state.data.modes[state.modeKey];
    var item = getCurrentItem();
    var qNum = state.index + 1;
    var total = mode.items.length;
    var prompt = '<p class="prompt" aria-live="polite">' + escapeHtml(item.prompt) + '</p>';
    var choicesHtml = '';
    state.selected = null;

    if (item.type === 'mcq') {
      choicesHtml = item.choices.map(function (choice, idx) {
        return '<button class="choice-btn" data-idx="' + idx + '" aria-label="Answer ' + (idx + 1) + '">' + escapeHtml(choice) + '</button>';
      }).join('');
    } else if (item.type === 'mcq-image') {
      // Single large image tile with labelled choices
      var imgBlock = renderImageTile(item);
      var btns = item.choices.map(function (choice, idx) {
        return '<button class="choice-btn" data-idx="' + idx + '">' + escapeHtml(choice) + '</button>';
      }).join('');
      choicesHtml = imgBlock + '<div class="choices" role="group" aria-label="Choices">' + btns + '</div>';
    } else if (item.type === 'tf') {
      choicesHtml = [
        '<button class="choice-btn" data-bool="true">True</button>',
        '<button class="choice-btn" data-bool="false">False</button>'
      ].join('');
    } else {
      choicesHtml = '<p>Unsupported question type.</p>';
    }

    var yClass = state.modeKey === 'y2_3' ? ' y23' : '';
    app.innerHTML = '' +
      '<section class="card quiz' + yClass + '" aria-labelledby="q-title">' +
      '  <h2 id="q-title">' + escapeHtml(state.data.meta.title) + ' — ' + escapeHtml(mode.label) + '</h2>' +
      '  <div class="muted">Question ' + qNum + ' of ' + total + '</div>' +
      '  ' + renderProgress() +
      '  ' + prompt +
      (item.type === 'mcq-image' ? choicesHtml : ('  <div class="choices" role="group" aria-label="Choices">' + choicesHtml + '</div>')) +
      '  <div class="feedback" aria-live="polite"></div>' +
      '  <div class="hint" aria-live="polite"></div>' +
      '  <div class="controls">' +
      '    <button class="link-btn" data-action="restart">Restart</button>' +
      '    <button class="link-btn" data-action="switch">Switch mode</button>' +
      '    <button class="next-btn" data-action="next" disabled>Next</button>' +
      '  </div>' +
      '</section>';

    wireQuestionHandlers(item);
    // Move focus to main landmark for screen readers
    var main = document.getElementById('app');
    if (main && typeof main.focus === 'function') { main.focus(); }
  }

  function wireQuestionHandlers(item) {
    var app = document.getElementById('app');
    var feedback = app.querySelector('.feedback');
    var choiceButtons = app.querySelectorAll('.choice-btn');
    var nextBtn = app.querySelector('[data-action="next"]');
    var hintBox = app.querySelector('.hint');

    function updateNextAvailability() {
      if (!nextBtn) return;
      var setting = getAdvanceSetting();
      if (setting) {
        nextBtn.disabled = state.selected == null;
      } else {
        // advance only on correct
        var isCorrect = isSelectionCorrect(item, state.selected);
        nextBtn.disabled = !isCorrect;
      }
    }

    choiceButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Clear previous visual states
        choiceButtons.forEach(function (b) { b.classList.remove('correct', 'wrong'); });
        // Store selection
        if (item.type === 'mcq' || item.type === 'mcq-image') {
          state.selected = parseInt(btn.getAttribute('data-idx'), 10);
        } else if (item.type === 'tf') {
          state.selected = (btn.getAttribute('data-bool') === 'true');
        }
        // Show feedback instantly
        var correct = isSelectionCorrect(item, state.selected);
        if (correct) {
          btn.classList.add('correct');
          feedback.textContent = 'Correct' + (item.explain ? ': ' + item.explain : '!');
          if (hintBox) hintBox.textContent = '';
        } else {
          btn.classList.add('wrong');
          feedback.textContent = 'Try again' + (item.explain ? ': ' + item.explain : '.');
          // Track wrong attempts for this index
          var key = String(state.index);
          state.wrongAttempts[key] = (state.wrongAttempts[key] || 0) + 1;
          var threshold = getAttemptsBeforeHint();
          if (item.hint && threshold > 0 && state.wrongAttempts[key] >= threshold) {
            if (hintBox) hintBox.textContent = 'Hint: ' + item.hint;
          }
        }
        updateNextAvailability();
      });
    });

    app.querySelector('[data-action="restart"]').addEventListener('click', function () {
      startMode(state.modeKey);
    });
    app.querySelector('[data-action="switch"]').addEventListener('click', function () {
      renderLanding(state.data);
    });
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        var correct = isSelectionCorrect(item, state.selected);
        if (correct) {
          state.correctSet[state.index] = true;
          persistProgress();
        }
        // Mark this question as visited in this pass
        state.visitedSet[state.index] = true;
        nextQuestion();
      });
    }
  }

  function nextQuestion() {
    var mode = state.data.modes[state.modeKey];
    var advanceAny = getAdvanceSetting();

    if (advanceAny) {
      // End after first full pass regardless of correctness
      var visited = Object.keys(state.visitedSet).length;
      if (visited >= mode.items.length) {
        renderBoardingPass();
        return;
      }
      state.index = Math.min(state.index + 1, mode.items.length - 1);
      renderQuestion();
      return;
    }

    // Traditional mastery path: end only when all correct
    var answered = Object.keys(state.correctSet).length;
    if (answered >= mode.items.length) {
      renderBoardingPass();
      return;
    }
    // Find next unanswered index, wrapping
    var next = state.index;
    for (var i = 0; i < mode.items.length; i++) {
      next = (next + 1) % mode.items.length;
      if (!state.correctSet[next]) break;
    }
    state.index = next;
    renderQuestion();
  }

  function renderBoardingPass() {
    var app = document.getElementById('app');
    var today = new Date();
    var dateStr = today.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
    var mode = state.data.modes[state.modeKey];
    var total = mode.items.length;
    var collected = Object.keys(state.correctSet).length;
    var meta = state.data.meta || {};
    var airline = meta.airline || 'Dubai British School Air';
    var gate = meta.gate || 'A7';
    var seat = generateSeat();
    var flight = generateFlightCode(meta.title || 'EIS-ES');
    var boardingTime = new Date(Date.now() + 5 * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    var barcodeSvg = createBarcodeSVG(flight);
    var passenger = (localStorage.getItem('bp_passenger') || '');
    app.innerHTML = '' +
      '<section class="card boarding" aria-labelledby="bp-title">' +
      '  <h2 id="bp-title" class="sr-only">Boarding Pass</h2>' +
      '  <div class="bp-wrap">' +
      '    <div class="ticket" role="group" aria-label="Boarding pass ticket">' +
      '      <div class="main">' +
      '        <div class="watermark">EISM</div>' +
      '        <div class="logo">' + renderLogo(airline) + '</div>' +
      '        <div class="route-line">DXB → Spain</div>' +
      '        <div class="kv">' +
      '          <div class="caps">Passenger</div><div><input class="passenger" aria-label="Passenger name" placeholder="Enter your name" value="' + escapeHtml(passenger) + '"></div>' +
      '          <div class="caps">Mode</div><div class="val">' + escapeHtml(mode.label) + '</div>' +
      '          <div class="caps">Date</div><div>' + escapeHtml(dateStr) + '</div>' +
      '          <div class="caps">Stickers</div><div class="val">' + collected + ' / ' + total + '</div>' +
      '          <div class="caps">Seat</div><div class="val mono">' + seat + '</div>' +
      '          <div class="caps">Gate</div><div class="val mono">' + gate + '</div>' +
      '          <div class="caps">Flight</div><div class="val mono">' + flight + '</div>' +
      '        </div>' +
      '      </div>' +
      '      <div class="stub" aria-label="Detachable stub">' +
      '        <div class="mini">' +
      '          <div class="caps">Airline</div><div class="val">' + escapeHtml(airline) + '</div>' +
      '          <div class="caps">Route</div><div class="val">DXB → ES</div>' +
      '          <div class="caps">Board</div><div class="val mono">' + boardingTime + '</div>' +
      '          <div class="caps">Gate</div><div class="val mono">' + gate + '</div>' +
      '          <div class="caps">Seat</div><div class="val mono">' + seat + '</div>' +
      '          <div class="caps">Flight</div><div class="val mono">' + flight + '</div>' +
      '        </div>' +
      '        <div class="barcode" role="img" aria-label="Boarding pass code: ' + escapeHtml(flight) + '">' + barcodeSvg + '</div>' +
      '      </div>' +
      '    </div>' +
      '    <div>' +
      '      <h3 class="caps">Stickers</h3>' +
      '      <div aria-label="Stickers collected" class="stickers">' + renderStickers() + '</div>' +
      '      ' + renderNextSteps(collected, total) +
      '    </div>' +
      '  </div>' +
      '  <div class="bp-ctas">' +
      '    <button class="cta" data-action="savepng">Save as PNG</button>' +
      '    <button class="link-btn" data-action="print">Print ticket</button>' +
      '    <button class="link-btn" data-action="restart">Restart</button>' +
      '    <button class="link-btn" data-action="switch">Switch mode</button>' +
      '    <button class="link-btn share-btn hide" data-action="share">Share</button>' +
      '  </div>' +
      '</section>';

    // Wire CTAs and inputs
    var restart = app.querySelector('[data-action="restart"]');
    var sw = app.querySelector('[data-action="switch"]');
    var saveBtn = app.querySelector('[data-action="savepng"]');
    var printBtn = app.querySelector('[data-action="print"]');
    var shareBtn = app.querySelector('[data-action="share"]');
    var nameInput = app.querySelector('input.passenger');
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        try { localStorage.setItem('bp_passenger', String(nameInput.value || '')); } catch(_){}
      });
    }
    restart.addEventListener('click', function () { startMode(state.modeKey); });
    sw.addEventListener('click', function () { renderLanding(state.data); });
    printBtn.addEventListener('click', function () { window.print(); });
    if (saveBtn) saveBtn.addEventListener('click', saveTicketAsPng);
    if (navigator.share && shareBtn) {
      shareBtn.classList.remove('hide');
      shareBtn.addEventListener('click', function () {
        navigator.share({ text: 'I unlocked my DXB → Spain boarding pass!' }).catch(function(){});
      });
    }
  }

  // Persistence: store mode and per-mode progress in localStorage
  var LS_KEY = 'escape_es_state_v1';

  function persistProgress() {
    try {
      var snapshot = {
        modeKey: state.modeKey,
        correctSet: state.correctSet
      };
      localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
    } catch (e) { /* ignore quota errors */ }
  }

  function restoreProgress() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var snap = JSON.parse(raw);
      if (snap && snap.modeKey && state.data && state.data.modes[snap.modeKey]) {
        state.modeKey = snap.modeKey;
        state.correctSet = snap.correctSet || {};
        state.index = Math.min(Object.keys(state.correctSet).length, state.data.modes[state.modeKey].items.length - 1);
        renderQuestion();
        return true;
      }
    } catch (e) { /* ignore corrupt data */ }
    return false;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function isSelectionCorrect(item, sel) {
    if (sel == null) return false;
    if (item.type === 'mcq' || item.type === 'mcq-image') {
      return sel === item.answer;
    }
    if (item.type === 'tf') {
      return sel === item.answer;
    }
    return false;
  }

  function getAdvanceSetting() {
    var mode = state.data && state.data.modes && state.data.modes[state.modeKey];
    var settings = mode && mode.settings || {};
    return settings.advanceOnAnyAnswer !== false; // default true
  }

  function getAttemptsBeforeHint() {
    var mode = state.data && state.data.modes && state.data.modes[state.modeKey];
    var settings = mode && mode.settings || {};
    var n = settings.attemptsBeforeHint;
    if (typeof n === 'number' && n >= 0) return n;
    return 2; // default
  }

  function renderImageTile(item) {
    var src = item.image;
    var alt = item.alt || item.prompt || 'Image';
    var status = imageStatus[src];
    if (src && status === 'ok') {
      return '' +
        '<div class="image-tile">' +
        '  <figure class="image-figure">' +
        '    <img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '">' +
        '  </figure>' +
        '  <figcaption class="image-caption">' + escapeHtml(alt) + '</figcaption>' +
        '</div>';
    }
    if (src && status === 'missing') {
      console.warn('[Image] Missing, using emoji fallback:', src);
    }
    // Fallback emoji tile
    return '' +
      '<div class="image-tile">' +
      '  <div class="image-figure image-fallback" aria-label="Image missing">🖼️</div>' +
      '  <div class="image-caption">' + escapeHtml(alt) + '</div>' +
      '</div>';
  }

  function renderStickers() {
    var mode = state.data.modes[state.modeKey];
    var items = mode.items;
    var out = '';
    for (var i = 0; i < items.length; i++) {
      var got = !!state.correctSet[i];
      var emoji = '⭐';
      // optional: vary by type
      if (items[i].type === 'mcq-image') emoji = '🖼️';
      else if (items[i].type === 'tf') emoji = '✔️';
      out += '<div class="sticker' + (got ? ' got' : '') + '" aria-label="Sticker ' + (i + 1) + (got ? ' collected' : ' not collected') + '">' + emoji + '</div>';
    }
    return out;
  }

  function renderLogo(airline) {
    var path = 'assets/logo-airline.svg';
    var status = imageStatus[path];
    if (status === 'ok') {
      return '<img src="' + path + '" alt="' + escapeHtml(airline) + ' logo"> <strong>' + escapeHtml(airline) + '</strong>';
    }
    if (status === 'missing') {
      return '<span class="fallback" aria-label="Airline">' + escapeHtml(airline) + '</span>';
    }
    return '<span class="fallback" aria-label="Airline">' + escapeHtml(airline) + '</span>';
  }

  function renderNextSteps(collected, total) {
    var pct = total ? (collected / total) : 0;
    var msg = 'Great work—aim for a full set!';
    if (pct < 0.7) msg = 'Try again to collect more stickers.';
    if (pct >= 1) msg = 'Full set! Show your ticket to your teacher.';
    return '<p class="muted">' + msg + '</p>';
  }

  function generateSeat() {
    var row = Math.floor(Math.random() * 20) + 3; // 3–22
    var letters = ['A','B','C','D','E','F'];
    return row + letters[Math.floor(Math.random() * letters.length)];
  }

  function generateFlightCode(prefix) {
    var n = Math.floor(Math.random() * 900) + 100; // 100–999
    return (prefix || 'EIS-ES') + n;
  }

  function createBarcodeSVG(text) {
    // Simple faux barcode using char codes
    var bars = '';
    var x = 0;
    for (var i = 0; i < text.length; i++) {
      var v = (text.charCodeAt(i) % 7) + 2; // 2–8 width
      bars += '<rect x="' + x + '" y="0" width="' + v + '" height="48" fill="black" />';
      x += v + 2;
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (x+2) + '" height="48" aria-hidden="true">' + bars + '</svg>';
  }

  function saveTicketAsPng() {
    var ticket = document.querySelector('.ticket');
    if (!ticket) return;
    // Render via SVG foreignObject for crisp export
    var xml = new XMLSerializer().serializeToString(ticket);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="360">' +
              '<foreignObject width="100%" height="100%">' +
              '<body xmlns="http://www.w3.org/1999/xhtml">' +
              '<style>*{box-sizing:border-box} .ticket{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial} </style>' +
              xml +
              '</body></foreignObject></svg>';
    var img = new Image();
    var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (pngBlob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = 'boarding-pass.png';
        a.click();
        setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
      }, 'image/png');
    };
    img.src = url;
  }

  function preflightImages(data) {
    var urls = [];
    try {
      ['y2_3', 'y4_6'].forEach(function (key) {
        var mode = data && data.modes && data.modes[key];
        if (mode && Array.isArray(mode.items)) {
          mode.items.forEach(function (it) {
            if (it && typeof it.image === 'string') urls.push(it.image);
          });
        }
      });
    } catch (_) {}
    if (!urls.length) return Promise.resolve();
    var found = 0, missing = 0;
    return Promise.all(urls.map(function (u) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () { imageStatus[u] = 'ok'; found += 1; resolve(); };
        img.onerror = function () { imageStatus[u] = 'missing'; missing += 1; resolve(); };
        img.src = u;
      });
    })).then(function () {
      console.log('[Images] Preflight complete:', found, 'found;', missing, 'missing (fallback will be used)');
    });
  }

  // Kick-off: render shell, load data, log counts, then render landing
  renderShell();
  loadQuestions().then(function (data) {
    if (!data) {
      console.warn('No question data available.');
      return;
    }
    state.data = data;
    logModeCounts(data);
    preflightImages(data).then(function () {
      // Try restore; if not restored, show landing
      if (!restoreProgress()) {
        renderLanding(data);
      }
    });
  });
})();


