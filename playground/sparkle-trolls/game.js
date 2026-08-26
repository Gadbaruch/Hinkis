/* =============================================================
   SPARKLE TROLLS — Crystal Sky Adventure
   A gentle 2D platformer. Nobody can lose. Collect everything.
   Plain JS + canvas, no libraries, works straight off the disk.
   ============================================================= */
(function () {
'use strict';

/* ------------------------------------------------------------------ */
/* setup                                                               */
/* ------------------------------------------------------------------ */
var W = 960, H = 540;                 // virtual screen size
var LEVEL_H = 900;                    // world height
var GROUND_Y = 800;                   // top of the ground

var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
}
resize();
window.addEventListener('resize', resize);

/* ------------------------------------------------------------------ */
/* input                                                               */
/* ------------------------------------------------------------------ */
var input = { left: false, right: false, jumpHeld: false, jumpQueued: 0, anyPressed: false };

function keyDown(e) {
  var k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') input.left = true;
  else if (k === 'arrowright' || k === 'd') input.right = true;
  else if (k === ' ' || k === 'arrowup' || k === 'w' || k === 'z') {
    if (!input.jumpHeld) input.jumpQueued = 0.14;
    input.jumpHeld = true;
  } else if (k === 'm') { musicOn = !musicOn; toast(musicOn ? 'Music on' : 'Music off'); }
  else if (k === 'r') { if (state === 'play') startLevel(levelIndex); }

  if (' arrowleftarrowrightarrowupadwz'.indexOf(k) >= 0 || k === ' ') e.preventDefault();
  input.anyPressed = true;
  ensureAudio();
  if (state === 'title' && k >= '1' && k <= String(LEVEL_BUILDERS.length)) {
    totals = blankTotals(); parade = []; startLevel(parseInt(k, 10) - 1);
  } else if (state === 'title' && (k === ' ' || k === 'enter')) startGame();
  else if (state === 'levelclear' && (k === ' ' || k === 'enter')) nextLevel();
  else if (state === 'win' && (k === ' ' || k === 'enter')) { totals = blankTotals(); parade = []; startGame(); }
}
function keyUp(e) {
  var k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') input.left = false;
  else if (k === 'arrowright' || k === 'd') input.right = false;
  else if (k === ' ' || k === 'arrowup' || k === 'w' || k === 'z') input.jumpHeld = false;
}
window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

// touch pad
var pad = document.getElementById('pad');
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) pad.classList.add('on');
function hold(id, on, off) {
  var el = document.getElementById(id);
  var down = function (e) { e.preventDefault(); ensureAudio(); on(); };
  var up = function (e) { e.preventDefault(); if (off) off(); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
}
hold('btnL', function () { input.left = true; }, function () { input.left = false; });
hold('btnR', function () { input.right = true; }, function () { input.right = false; });
hold('btnJ', function () {
  input.jumpQueued = 0.14; input.jumpHeld = true;
  if (state === 'title') startGame();
  else if (state === 'levelclear') nextLevel();
  else if (state === 'win') { totals = blankTotals(); parade = []; startGame(); }
}, function () { input.jumpHeld = false; });

canvas.addEventListener('pointerdown', function () {
  ensureAudio();
  if (state === 'title') startGame();
  else if (state === 'levelclear') nextLevel();
  else if (state === 'win') { totals = blankTotals(); parade = []; startGame(); }
});

/* ------------------------------------------------------------------ */
/* sound — tiny built-in synth, no files needed                        */
/* ------------------------------------------------------------------ */
var actx = null, musicGain = null, sfxGain = null;
var musicOn = true;

function ensureAudio() {
  if (!actx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    musicGain = actx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(actx.destination);
    sfxGain = actx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(actx.destination);
    nextNoteTime = actx.currentTime + 0.1;
  }
  if (actx.state === 'suspended') actx.resume();
}
function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

function blip(freq, dur, type, vol, dest, when) {
  if (!actx) return;
  var t0 = when || actx.currentTime;
  var o = actx.createOscillator(), g = actx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.25));
  o.connect(g); g.connect(dest || sfxGain);
  o.start(t0); o.stop(t0 + (dur || 0.25) + 0.05);
}
// pentatonic ladder so every pickup sounds pretty together
var PENTA = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84];
var pentaStep = 0, pentaTimer = 0;
function chime() {
  blip(midi(PENTA[pentaStep]), 0.5, 'triangle', 0.22);
  blip(midi(PENTA[pentaStep] + 12), 0.35, 'sine', 0.1);
  pentaStep = Math.min(pentaStep + 1, PENTA.length - 1);
  pentaTimer = 2.2;
}
function sfxJump() { if (!actx) return; var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(680, t + 0.12);
  g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.25); }
function sfxTroll() { blip(midi(72), 0.18, 'square', 0.12); blip(midi(79), 0.3, 'triangle', 0.18, null, actx ? actx.currentTime + 0.09 : 0); }
function sfxHeart() { blip(midi(76), 0.3, 'sine', 0.2); blip(midi(83), 0.4, 'sine', 0.12, null, actx ? actx.currentTime + 0.08 : 0); }
function sfxWin() {
  if (!actx) return; var t = actx.currentTime;
  [60, 64, 67, 72, 76, 79, 84].forEach(function (n, i) {
    blip(midi(n), 0.6, 'triangle', 0.2, null, t + i * 0.11);
  });
}

// gentle background arpeggio
var nextNoteTime = 0, mStep = 0;
var MELODY = [
  [48, 64, 67, 72, 67, 64, 67, 72],
  [45, 64, 69, 72, 69, 64, 69, 72],
  [41, 60, 65, 69, 65, 60, 65, 69],
  [43, 62, 67, 71, 67, 62, 67, 71]
];
function updateMusic() {
  if (!actx || !musicGain) return;
  musicGain.gain.value = musicOn ? 0.16 : 0.0;
  var now = actx.currentTime;
  if (nextNoteTime < now) nextNoteTime = now + 0.05;
  while (nextNoteTime < now + 0.25) {
    var bar = MELODY[Math.floor(mStep / 8) % MELODY.length];
    var n = bar[mStep % 8];
    var isBass = (mStep % 8) === 0;
    blip(midi(n), isBass ? 1.1 : 0.5, isBass ? 'sine' : 'triangle', isBass ? 0.5 : 0.2, musicGain, nextNoteTime);
    nextNoteTime += 0.235;
    mStep++;
  }
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
var TAU = Math.PI * 2;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
// stable pseudo-random from a number (so decorations don't flicker)
function hash(n) { var s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function poly(pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}
function glow(x, y, r, color) {
  var g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
function sparkle(x, y, r, color, rot) {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.16, -r * 0.16, r, 0);
  ctx.quadraticCurveTo(r * 0.16, r * 0.16, 0, r);
  ctx.quadraticCurveTo(-r * 0.16, r * 0.16, -r, 0);
  ctx.quadraticCurveTo(-r * 0.16, -r * 0.16, 0, -r);
  ctx.fill();
  ctx.restore();
}
function heartPath(s) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.95);
  ctx.bezierCurveTo(-s * 1.35, s * 0.05, -s * 0.78, -s * 1.05, 0, -s * 0.28);
  ctx.bezierCurveTo(s * 0.78, -s * 1.05, s * 1.35, s * 0.05, 0, s * 0.95);
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* pretty things to draw                                               */
/* ------------------------------------------------------------------ */

// a blue shiny crystal
function drawCrystal(x, y, s, t) {
  var pulse = 0.85 + Math.sin(t * 3) * 0.15;
  glow(x, y, s * 2.6 * pulse, 'rgba(120, 225, 255, 0.38)');
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2) * 2);
  var body = [[0, -s * 1.15], [s * 0.62, -s * 0.3], [s * 0.42, s * 1.0], [-s * 0.42, s * 1.0], [-s * 0.62, -s * 0.3]];
  var g = ctx.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, '#dffaff');
  g.addColorStop(0.35, '#7fd8ff');
  g.addColorStop(0.75, '#2f8fe8');
  g.addColorStop(1, '#1b52b8');
  ctx.fillStyle = g;
  poly(body); ctx.fill();
  // bright facet
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  poly([[0, -s * 1.15], [-s * 0.62, -s * 0.3], [-s * 0.18, s * 0.5], [0, -s * 0.1]]); ctx.fill();
  // dark facet
  ctx.fillStyle = 'rgba(10, 40, 120, 0.35)';
  poly([[0, -s * 1.15], [s * 0.62, -s * 0.3], [s * 0.42, s * 1.0], [0, s * 0.25]]); ctx.fill();
  ctx.strokeStyle = 'rgba(225, 250, 255, 0.85)'; ctx.lineWidth = 1.6;
  poly(body); ctx.stroke();
  ctx.restore();
  sparkle(x - s * 0.35, y - s * 0.6, s * 0.5 * pulse, 'rgba(255,255,255,0.95)');
  sparkle(x + s * 0.55, y + s * 0.35, s * 0.28 * pulse, 'rgba(210,245,255,0.8)');
}

// a magic music note
function drawNote(x, y, s, t) {
  var hue = (t * 60) % 360;
  glow(x, y, s * 2.4, 'hsla(' + hue + ', 100%, 72%, 0.45)');
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2.4) * 3);
  ctx.rotate(Math.sin(t * 1.6) * 0.14);
  var g = ctx.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, 'hsl(' + hue + ', 100%, 82%)');
  g.addColorStop(1, 'hsl(' + ((hue + 90) % 360) + ', 100%, 62%)');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.4;
  // stem
  rr(-s * 0.02, -s * 0.95, s * 0.2, s * 1.45, s * 0.08); ctx.fill();
  // flag
  ctx.beginPath();
  ctx.moveTo(s * 0.16, -s * 0.95);
  ctx.quadraticCurveTo(s * 1.1, -s * 0.62, s * 0.6, s * 0.16);
  ctx.quadraticCurveTo(s * 0.82, -s * 0.42, s * 0.16, -s * 0.5);
  ctx.closePath(); ctx.fill();
  // head
  ctx.save();
  ctx.rotate(-0.34);
  ctx.beginPath(); ctx.ellipse(-s * 0.32, s * 0.6, s * 0.5, s * 0.36, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
  sparkle(x + s * 0.75, y - s * 0.8, s * 0.42 + Math.sin(t * 5) * 2, 'rgba(255,255,255,0.9)');
}

// a heart
function drawHeart(x, y, s, t) {
  var beat = 1 + Math.sin(t * 4) * 0.09;
  glow(x, y, s * 2.4, 'rgba(255, 130, 190, 0.4)');
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2) * 2.5);
  ctx.scale(beat, beat * (1 - (beat - 1) * 0.6));
  var g = ctx.createLinearGradient(0, -s, 0, s);
  g.addColorStop(0, '#ffc9e5');
  g.addColorStop(0.45, '#ff6fb4');
  g.addColorStop(1, '#e0246f');
  ctx.fillStyle = g;
  heartPath(s); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.ellipse(-s * 0.4, -s * 0.35, s * 0.2, s * 0.13, -0.5, 0, TAU); ctx.fill();
  ctx.restore();
}

// a jewel / diamond
function drawGem(x, y, s, t, hue) {
  hue = hue === undefined ? 190 : hue;
  var spin = Math.sin(t * 1.3) * 0.5 + 0.5;         // fake rotation via width
  glow(x, y, s * 2.6, 'hsla(' + hue + ', 100%, 70%, 0.35)');
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 1.7) * 3);
  ctx.scale(0.55 + spin * 0.45, 1);
  var top = -s * 0.62, mid = -s * 0.2, bot = s * 1.0;
  var g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, 'hsl(' + hue + ', 100%, 92%)');
  g.addColorStop(0.4, 'hsl(' + hue + ', 92%, 70%)');
  g.addColorStop(1, 'hsl(' + ((hue + 25) % 360) + ', 90%, 45%)');
  ctx.fillStyle = g;
  poly([[-s * 0.5, top], [s * 0.5, top], [s * 0.85, mid], [0, bot], [-s * 0.85, mid]]); ctx.fill();
  // table
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  poly([[-s * 0.5, top], [s * 0.5, top], [s * 0.3, mid], [-s * 0.3, mid]]); ctx.fill();
  // facets
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  poly([[-s * 0.85, mid], [-s * 0.3, mid], [0, bot]]); ctx.fill();
  ctx.fillStyle = 'rgba(0, 20, 80, 0.22)';
  poly([[s * 0.85, mid], [s * 0.3, mid], [0, bot]]); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.4;
  poly([[-s * 0.5, top], [s * 0.5, top], [s * 0.85, mid], [0, bot], [-s * 0.85, mid]]); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.85, mid); ctx.lineTo(s * 0.85, mid); ctx.stroke();
  ctx.restore();
  sparkle(x - s * 0.5, y - s * 0.75, s * 0.45 + Math.sin(t * 6) * 2, 'rgba(255,255,255,0.95)');
}

/* a troll: fluffy hair, round belly, big smile.
   hue 185..225 = blue and shiny. The player troll gets rainbow hair. */
function drawTroll(x, y, s, t, hue, opt) {
  opt = opt || {};
  var rainbow = !!opt.rainbow;
  var face = opt.face === undefined ? 1 : opt.face;
  var squash = opt.squash === undefined ? 1 : opt.squash;
  var bob = Math.sin(t * 3) * s * 0.05;

  ctx.save();
  ctx.translate(x, y);

  // shadow on the floor
  if (!opt.noShadow) {
    ctx.fillStyle = 'rgba(6, 10, 40, 0.3)';
    ctx.beginPath(); ctx.ellipse(0, s * 0.06, s * 0.75, s * 0.18, 0, 0, TAU); ctx.fill();
  }

  ctx.scale(face, 1);
  ctx.translate(0, bob);
  ctx.scale(1 / squash, squash);
  ctx.translate(0, -s * 0.9);   // body centre

  var bodyH = s * 0.92, bodyW = s * 0.8;
  var hairColor = function (l) {
    return rainbow ? 'hsl(' + ((t * 90) % 360) + ', 100%, ' + l + '%)' : 'hsl(' + hue + ', 95%, ' + l + '%)';
  };

  // ---- hair (behind the body): a big troll-doll flame
  var spikes = 7;
  for (var i = 0; i < spikes; i++) {
    var f = i / (spikes - 1) - 0.5;                       // -0.5 .. 0.5
    var ang = f * 1.5 + Math.sin(t * 2 + i) * 0.09;
    var len = s * (1.15 - Math.abs(f) * 0.85) + Math.sin(t * 3 + i * 1.7) * s * 0.05;
    ctx.save();
    ctx.translate(f * bodyW * 0.75, -bodyH * 0.62);
    ctx.rotate(ang);
    var hg = ctx.createLinearGradient(0, 0, 0, -len);
    hg.addColorStop(0, hairColor(rainbow ? 70 : 45));
    hg.addColorStop(1, hairColor(88));
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(-s * 0.19, 0);
    ctx.quadraticCurveTo(-s * 0.15, -len * 0.65, 0, -len);
    ctx.quadraticCurveTo(s * 0.15, -len * 0.65, s * 0.19, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---- feet
  ctx.fillStyle = 'hsl(' + hue + ', 70%, 42%)';
  ctx.beginPath(); ctx.ellipse(-bodyW * 0.42, bodyH * 0.86, s * 0.24, s * 0.14, -0.15, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bodyW * 0.42, bodyH * 0.86, s * 0.24, s * 0.14, 0.15, 0, TAU); ctx.fill();

  // ---- body (pear shaped, shiny)
  var bg = ctx.createRadialGradient(-bodyW * 0.3, -bodyH * 0.35, s * 0.05, 0, 0, bodyW * 1.5);
  bg.addColorStop(0, 'hsl(' + hue + ', 100%, 85%)');
  bg.addColorStop(0.45, 'hsl(' + hue + ', 90%, 63%)');
  bg.addColorStop(1, 'hsl(' + (hue + 14) + ', 85%, 38%)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(0, -bodyH * 0.92);
  ctx.bezierCurveTo(bodyW * 1.02, -bodyH * 0.85, bodyW * 1.02, bodyH * 0.92, 0, bodyH * 0.9);
  ctx.bezierCurveTo(-bodyW * 1.02, bodyH * 0.92, -bodyW * 1.02, -bodyH * 0.85, 0, -bodyH * 0.92);
  ctx.closePath(); ctx.fill();

  // ---- arms
  ctx.strokeStyle = 'hsl(' + hue + ', 88%, 58%)';
  ctx.lineCap = 'round'; ctx.lineWidth = s * 0.17;
  var swing = Math.sin(t * 6) * (opt.walking ? 0.55 : 0.12);
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.78, -bodyH * 0.02);
  ctx.lineTo(-bodyW * 1.05, bodyH * 0.32 - swing * s * 0.35);
  ctx.moveTo(bodyW * 0.78, -bodyH * 0.02);
  ctx.lineTo(bodyW * 1.05, bodyH * 0.32 + swing * s * 0.35);
  ctx.stroke();

  // ---- belly gem (shiny!)
  ctx.save();
  ctx.translate(0, bodyH * 0.26);
  if (opt.heartBelly) {
    ctx.fillStyle = '#ff77b8';
    heartPath(s * 0.24); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.3; ctx.stroke();
  } else {
    var gg = ctx.createLinearGradient(0, -s * 0.25, 0, s * 0.25);
    gg.addColorStop(0, '#eafcff'); gg.addColorStop(1, '#48b6ff');
    ctx.fillStyle = gg;
    poly([[0, -s * 0.26], [s * 0.19, 0], [0, s * 0.26], [-s * 0.19, 0]]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.restore();

  // ---- shiny highlight on the body
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.ellipse(-bodyW * 0.36, -bodyH * 0.38, s * 0.2, s * 0.32, -0.5, 0, TAU); ctx.fill();

  // ---- face
  var blink = (Math.sin(t * 1.3 + x * 0.01) > 0.97) ? 0.12 : 1;
  var eyeY = -bodyH * 0.22, eyeX = bodyW * 0.34;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(-eyeX, eyeY, s * 0.16, s * 0.19 * blink, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(eyeX, eyeY, s * 0.16, s * 0.19 * blink, 0, 0, TAU); ctx.fill();
  if (blink > 0.5) {
    ctx.fillStyle = '#17224e';
    ctx.beginPath(); ctx.arc(-eyeX + s * 0.03, eyeY + s * 0.02, s * 0.085, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeX + s * 0.03, eyeY + s * 0.02, s * 0.085, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-eyeX + s * 0.06, eyeY - s * 0.03, s * 0.03, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeX + s * 0.06, eyeY - s * 0.03, s * 0.03, 0, TAU); ctx.fill();
  }
  // blush
  ctx.fillStyle = 'rgba(255, 140, 190, 0.5)';
  ctx.beginPath(); ctx.ellipse(-eyeX - s * 0.12, eyeY + s * 0.24, s * 0.12, s * 0.07, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(eyeX + s * 0.12, eyeY + s * 0.24, s * 0.12, s * 0.07, 0, 0, TAU); ctx.fill();
  // smile
  ctx.strokeStyle = '#17224e'; ctx.lineWidth = s * 0.055; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, eyeY + s * 0.16, s * 0.18, 0.25, Math.PI - 0.25); ctx.stroke();

  ctx.restore();

  // sparkles around a shiny troll
  var sp = (Math.sin(t * 2.2 + x) * 0.5 + 0.5);
  sparkle(x + s * 0.9, y - s * 1.5, s * 0.16 + sp * s * 0.1, 'rgba(255,255,255,0.9)');
  sparkle(x - s * 1.0, y - s * 0.9, s * 0.12 + (1 - sp) * s * 0.1, 'rgba(190,240,255,0.9)');
}

// the rainbow doorway at the end of a level
function drawPortal(x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  for (var i = 6; i >= 0; i--) {
    var r = 46 + i * 13 + Math.sin(t * 2 + i * 0.6) * 4;
    ctx.strokeStyle = 'hsla(' + ((t * 60 + i * 45) % 360) + ', 100%, 68%, ' + (0.16 + i * 0.045) + ')';
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(0, -110, r, Math.PI * 0.02, Math.PI * 0.98, true); ctx.stroke();
  }
  glow(0, -110, 90, 'rgba(255,255,255,0.28)');
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath(); ctx.ellipse(0, -110, 44, 62, 0, 0, TAU); ctx.fill();
  for (var j = 0; j < 8; j++) {
    var a = t * 1.4 + j * TAU / 8;
    sparkle(Math.cos(a) * 62, -110 + Math.sin(a) * 78, 5 + Math.sin(t * 4 + j) * 2.5, 'rgba(255,255,255,0.9)');
  }
  ctx.restore();
}

// a chunky crystal ledge
function drawPlatform(p, t) {
  var x = p.x, y = p.y, w = p.w, h = p.h;
  ctx.fillStyle = 'rgba(6, 10, 40, 0.32)';
  rr(x + 5, y + 8, w, h, 14); ctx.fill();

  var g = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 260));
  g.addColorStop(0, '#5a86e0');
  g.addColorStop(0.18, '#2f4fb0');
  g.addColorStop(1, '#131e56');
  ctx.fillStyle = g;
  rr(x, y, w, h, 14); ctx.fill();

  // glowing top lip
  ctx.fillStyle = 'rgba(150, 235, 255, 0.95)';
  rr(x + 4, y + 3, w - 8, 8, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  rr(x + 10, y + 4, Math.max(10, w * 0.35), 3, 2); ctx.fill();

  // little crystals growing on top
  var n = Math.max(1, Math.floor(w / 90));
  for (var i = 0; i < n; i++) {
    var hx = x + 22 + (w - 44) * ((i + 0.5) / n) + hash(p.x + i * 13) * 16 - 8;
    var hs = 5 + hash(p.x + i * 7) * 5;
    ctx.save();
    ctx.translate(hx, y - hs * 0.6);
    ctx.fillStyle = 'rgba(160, 230, 255, 0.9)';
    poly([[0, -hs * 1.5], [hs * 0.55, 0], [-hs * 0.55, 0]]); ctx.fill();
    ctx.restore();
  }
  // embedded sparkles
  var rows = Math.min(4, Math.floor(h / 34));
  for (var r2 = 0; r2 < rows; r2++) {
    for (var c = 0; c < Math.floor(w / 78); c++) {
      var sx = x + 26 + c * 78 + hash(p.x + r2 * 3 + c) * 30;
      var sy = y + 30 + r2 * 34;
      if (sy > y + h - 8) continue;
      sparkle(sx, sy, 2 + Math.sin(t * 2.5 + c + r2) * 1.2, 'rgba(190, 240, 255, 0.55)');
    }
  }
}

/* ------------------------------------------------------------------ */
/* levels                                                              */
/* ------------------------------------------------------------------ */
function itemAt(x, y, extra) {
  var o = { x: x, y: y, got: false, t: Math.random() * TAU, pop: 0 };
  if (extra) for (var k in extra) o[k] = extra[k];
  return o;
}

function Level(name, width, tint) {
  this.name = name;
  this.width = width;
  this.tint = tint || 0;
  this.plats = [];
  this.crystals = []; this.notes = []; this.hearts = []; this.gems = [];
  this.trolls = [];
  this.portal = { x: width - 120, y: GROUND_Y };
  this.start = { x: 90, y: GROUND_Y - 70 };
}
/* Ledges are "jump-through": you sail up past them and land on top coming down.
   No banging your head on a ceiling, which is the least fun thing in a platformer.
   Only the ground is solid. */
Level.prototype.plat = function (x, y, w, h, opt) {
  opt = opt || {};
  this.plats.push({
    x: x, y: y, w: w, h: h === undefined ? 26 : h,
    baseY: y, bob: opt.bob || 0, bobSpeed: opt.bobSpeed || 1.2,
    phase: opt.phase === undefined ? hash(x + y) * TAU : opt.phase, dy: 0,
    oneWay: opt.oneWay === undefined ? true : opt.oneWay
  });
  return this;
};
Level.prototype.ground = function (x, w) {
  return this.plat(x, GROUND_Y, w, LEVEL_H - GROUND_Y + 60, { oneWay: false });
};
Level.prototype.crystal = function (x, y) { this.crystals.push(itemAt(x, y)); return this; };
Level.prototype.note = function (x, y) { this.notes.push(itemAt(x, y)); return this; };
Level.prototype.heart = function (x, y) { this.hearts.push(itemAt(x, y)); return this; };
Level.prototype.gem = function (x, y, hue) { this.gems.push(itemAt(x, y, { hue: hue === undefined ? 150 + hash(x) * 180 : hue })); return this; };
Level.prototype.troll = function (x, y) {
  this.trolls.push({ x: x, y: y, t: hash(x) * TAU, hue: 186 + hash(x * 3) * 40, freed: false, homeY: y });
  return this;
};
// a row of things
Level.prototype.row = function (kind, x, y, n, dx, dy) {
  for (var i = 0; i < n; i++) this[kind](x + i * dx, y + i * (dy || 0));
  return this;
};
// a jump-shaped arc of things
Level.prototype.arc = function (kind, x, y, n, w2, h2) {
  for (var i = 0; i < n; i++) {
    var f = i / (n - 1);
    this[kind](x + f * w2, y - Math.sin(f * Math.PI) * h2);
  }
  return this;
};

function buildLevel1() {
  var L = new Level('Crystal Meadow', 3400, 0);
  // holes are ~120 wide; a running jump carries about 236, so there is room to spare
  L.ground(-200, 1100); L.ground(1020, 730); L.ground(1870, 630); L.ground(2610, 990);

  // every climb is one comfortable single jump — the double jump is a bonus, never a must.
  // 90px up from the ground, then 80px a step, and only a little bobbing.
  L.plat(330, 710, 130); L.plat(540, 630, 130); L.plat(770, 710, 150);
  L.plat(1160, 710, 150); L.plat(1360, 630, 130); L.plat(1560, 710, 150);
  L.plat(1985, 710, 140, 26, { bob: 6 });
  L.plat(2190, 630, 130, 26, { bob: 6, phase: 1.6 });
  L.plat(2390, 710, 140, 26, { bob: 6, phase: 3.1 });
  L.plat(2760, 710, 160); L.plat(2985, 630, 150);

  L.row('crystal', 180, 748, 4, 52);
  L.arc('crystal', 900, 740, 6, 160, 120);              // over the first pit
  L.arc('crystal', 1760, 740, 6, 150, 120);
  L.arc('crystal', 2510, 740, 5, 130, 110);
  L.row('crystal', 350, 640, 3, 44);
  L.row('crystal', 1180, 610, 3, 46);
  L.row('crystal', 2780, 614, 3, 48);

  L.row('note', 560, 540, 3, 46);
  L.row('note', 1380, 500, 3, 44);
  L.row('note', 2210, 486, 3, 44);
  L.note(3010, 505); L.note(3070, 505);

  L.heart(600, 460); L.heart(1420, 430); L.heart(2250, 400); L.heart(3060, 430);
  L.row('heart', 200, 690, 3, 56);
  L.arc('heart', 1180, 620, 3, 120, 60);
  L.row('heart', 2800, 600, 3, 54);

  L.gem(690, 330, 200); L.gem(1250, 300, 280); L.gem(1900, 270, 330);
  L.gem(2320, 330, 45); L.gem(2900, 300, 160); L.gem(430, 400, 260);

  L.troll(470, GROUND_Y); L.troll(1360 + 65, 630); L.troll(2190 + 65, 630); L.troll(2985 + 75, 630);
  return L;
}

function buildLevel2() {
  var L = new Level('Jewel Sky', 3900, 30);
  L.ground(-200, 800); L.ground(1500, 420); L.ground(3100, 1000);

  // a long floating staircase over open sky
  L.plat(700, 710, 130, 26, { bob: 6 });
  L.plat(900, 630, 120, 26, { bob: 6, phase: 1 });
  L.plat(1110, 550, 120, 26, { bob: 6, phase: 2 });
  L.plat(1320, 630, 130, 26, { bob: 6, phase: 3 });
  L.plat(1520, 710, 120, 26, { bob: 0 });
  L.plat(1980, 710, 140, 26, { bob: 6 });
  L.plat(2190, 630, 130, 26, { bob: 6, phase: 2.2 });
  L.plat(2400, 550, 130, 26, { bob: 6, phase: 4.1 });
  L.plat(2620, 630, 140, 26, { bob: 6, phase: 0.7 });
  L.plat(2840, 710, 150, 26, { bob: 6, phase: 2.9 });
  L.plat(3180, 710, 140); L.plat(3390, 630, 140); L.plat(3600, 550, 150);

  L.row('crystal', 150, 748, 5, 54);
  L.arc('crystal', 600, 700, 6, 150, 110);
  L.arc('crystal', 1660, 690, 6, 150, 120);
  L.arc('crystal', 2940, 660, 7, 180, 130);
  L.row('crystal', 930, 560, 3, 44);
  L.row('crystal', 2420, 440, 3, 44);

  L.row('note', 1130, 460, 3, 46);
  L.row('note', 2210, 530, 3, 44);
  L.row('note', 3410, 480, 3, 46);
  L.arc('note', 1780, 620, 5, 140, 90);

  L.heart(1170, 380); L.heart(2465, 360); L.heart(760, 600); L.heart(3670, 340); L.heart(2000, 600);
  L.row('heart', 250, 690, 3, 56);
  L.arc('heart', 900, 560, 3, 130, 60);
  L.row('heart', 2650, 520, 3, 54);

  // the sky is FULL of jewels here
  L.arc('gem', 420, 420, 5, 300, 130);
  L.arc('gem', 1300, 380, 6, 420, 160);
  L.arc('gem', 2300, 330, 6, 460, 150);
  L.gem(3300, 300, 300); L.gem(3560, 250, 20); L.gem(3760, 320, 190);

  L.troll(300, GROUND_Y); L.troll(1110 + 60, 550); L.troll(1650, GROUND_Y);
  L.troll(2400 + 65, 550); L.troll(3390 + 70, 630); L.troll(3600 + 75, 550);
  L.portal = { x: 3800, y: GROUND_Y };
  return L;
}

function buildLevel3() {
  var L = new Level('Rainbow Peak', 4300, 300);
  L.ground(-200, 900); L.ground(1250, 380); L.ground(2400, 360); L.ground(3500, 1000);

  L.plat(760, 710, 120, 26, { bob: 6 });
  L.plat(950, 630, 120, 26, { bob: 6, phase: 1.4 });
  L.plat(1140, 550, 120, 26, { bob: 6, phase: 2.8 });
  L.plat(1330, 640, 130);
  L.plat(1700, 710, 130, 26, { bob: 6 });
  L.plat(1890, 630, 120, 26, { bob: 6, phase: 1.1 });
  L.plat(2080, 550, 120, 26, { bob: 6, phase: 2.2 });
  L.plat(2270, 630, 130, 26, { bob: 6, phase: 3.3 });
  L.plat(2460, 710, 140);
  L.plat(2790, 710, 130, 26, { bob: 6 });
  L.plat(2990, 630, 130, 26, { bob: 6, phase: 1.9 });
  L.plat(3190, 550, 130, 26, { bob: 6, phase: 3.8 });
  L.plat(3390, 630, 140, 26, { bob: 6, phase: 0.4 });
  // the peak
  L.plat(3700, 710, 150); L.plat(3900, 630, 150); L.plat(4090, 550, 170);

  L.row('crystal', 160, 748, 5, 52);
  L.arc('crystal', 640, 700, 6, 150, 110);
  L.arc('crystal', 1500, 690, 6, 160, 120);
  L.arc('crystal', 2680, 660, 5, 130, 110);
  L.row('crystal', 1350, 570, 3, 44);
  L.row('crystal', 3720, 610, 3, 46);
  L.row('crystal', 2480, 610, 3, 46);

  L.arc('note', 800, 620, 5, 160, 100);
  L.row('note', 1910, 530, 3, 44);
  L.row('note', 2980, 485, 3, 44);
  L.arc('note', 3560, 600, 5, 150, 110);
  L.row('note', 4120, 390, 4, 44);

  L.heart(1190, 360); L.heart(2140, 330); L.heart(3210, 290);
  L.heart(1000, 540); L.heart(2800, 580); L.heart(4160, 300); L.heart(400, 620);
  L.row('heart', 220, 690, 3, 56);
  L.arc('heart', 1750, 620, 3, 130, 60);
  L.row('heart', 2500, 600, 3, 54);
  L.row('heart', 3720, 560, 3, 54);

  L.arc('gem', 300, 400, 6, 380, 150);
  L.arc('gem', 1200, 330, 7, 520, 170);
  L.arc('gem', 2200, 300, 7, 520, 160);
  L.arc('gem', 3300, 280, 6, 480, 150);
  L.gem(4200, 220, 320); L.gem(4020, 300, 40);

  L.troll(340, GROUND_Y); L.troll(1140 + 60, 550); L.troll(1400, GROUND_Y);
  L.troll(2080 + 60, 550); L.troll(2530, GROUND_Y); L.troll(3190 + 65, 550);
  L.troll(3900 + 75, 630); L.troll(4090 + 85, 550);
  // the doorway sits on the ground at the far end, so running right always finds it —
  // the peak above it is an optional climb for the last two trolls and the best jewels
  L.portal = { x: 4230, y: GROUND_Y };
  return L;
}

/* Nothing shiny should ever be out of reach — that is just sad.
   This nudges any pick-up that floats too high down to where a double
   jump can still get it. (The jewels far away in the sky are only
   scenery, so they stay right where they are.) */
var SINGLE_JUMP = 121, DOUBLE_JUMP = 213, REACH = 225;
function fixReach(L) {
  var surfaces = L.plats.map(function (p) {
    return { x1: p.x, x2: p.x + p.w, top: p.baseY - (p.bob || 0) };
  });
  function nearest(x) {
    var best = null, bestD = Infinity;
    for (var i = 0; i < surfaces.length; i++) {
      var s = surfaces[i];
      var d = x < s.x1 ? s.x1 - x : x > s.x2 ? x - s.x2 : 0;
      if (d < bestD) { bestD = d; best = s; }
    }
    return { s: best, d: bestD };
  }
  function fix(it) {
    // surfaces you could jump from, roughly under this pick-up
    var under = surfaces.filter(function (s) { return it.x >= s.x1 - 170 && it.x <= s.x2 + 170; });
    if (!under.length) {
      var n = nearest(it.x);
      it.x = clamp(it.x, n.s.x1 - 150, n.s.x2 + 150);
      under = [n.s];
    }
    // the highest ledge nearby decides how high this thing may hang
    var highest = under.reduce(function (a, b) { return b.top < a.top ? b : a; });
    if (it.y < highest.top - REACH) it.y = highest.top - REACH;
    if (it.y > LEVEL_H - 60) it.y = LEVEL_H - 60;
  }
  L.crystals.forEach(fix); L.notes.forEach(fix); L.hearts.forEach(fix); L.gems.forEach(fix);
  return L;
}

var LEVEL_BUILDERS = [buildLevel1, buildLevel2, buildLevel3].map(function (build) {
  return function () { return fixReach(build()); };
});

/* ------------------------------------------------------------------ */
/* game state                                                          */
/* ------------------------------------------------------------------ */
var GRAVITY = 2100, MOVE_ACC = 3400, AIR_ACC = 2500, MAX_SPEED = 340, FRICTION = 3200;
var JUMP_V = 730, COYOTE = 0.12;

var state = 'title';
var level = null, levelIndex = 0;
var t = 0;                     // global time
var cam = { x: 0, y: 0 };
var particles = [];
var trail = [];
var parade = [];               // trolls following the player, across levels
var toastText = '', toastTime = 0;
var clearTimer = 0;
var confetti = [];

function blankTotals() { return { crystals: 0, notes: 0, hearts: 0, gems: 0, trolls: 0 }; }
var totals = blankTotals();
var levelCount = blankTotals();

var player = {
  x: 0, y: 0, w: 34, h: 52, vx: 0, vy: 0,
  onGround: false, coyote: 0, jumpsLeft: 2, face: 1,
  squash: 1, standingOn: null, safe: { x: 0, y: 0 }, safeTimer: 0, walking: false
};

function toast(msg) { toastText = msg; toastTime = 2; }

function startGame() {
  levelIndex = 0;
  totals = blankTotals();
  parade = [];
  startLevel(0);
}
function startLevel(i) {
  levelIndex = i;
  level = LEVEL_BUILDERS[i]();
  levelCount = blankTotals();
  player.x = level.start.x; player.y = level.start.y;
  player.vx = 0; player.vy = 0; player.jumpsLeft = 2; player.standingOn = null;
  player.safe.x = player.x; player.safe.y = player.y;
  cam.x = clamp(player.x - W / 2, 0, level.width - W);
  cam.y = clamp(player.y - H / 2, 0, LEVEL_H - H);
  trail.length = 0;
  particles.length = 0;
  confetti.length = 0;
  pentaStep = 0;
  state = 'play';
  toast(level.name);
}
function nextLevel() {
  if (levelIndex + 1 < LEVEL_BUILDERS.length) startLevel(levelIndex + 1);
  else { state = 'win'; sfxWin(); makeConfetti(60); }
}

/* ------------------------------------------------------------------ */
/* particles                                                           */
/* ------------------------------------------------------------------ */
function burst(x, y, n, color, opt) {
  opt = opt || {};
  for (var i = 0; i < n; i++) {
    var a = rand(0, TAU), sp = rand(40, opt.speed || 220);
    particles.push({
      x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.up || 40),
      life: rand(0.4, opt.life || 0.9), max: 1, size: rand(2, opt.size || 6),
      color: color, grav: opt.grav === undefined ? 380 : opt.grav, rot: rand(0, TAU)
    });
  }
}
function makeConfetti(n) {
  for (var i = 0; i < n; i++) {
    confetti.push({
      x: rand(0, W), y: rand(-H, 0), vy: rand(60, 170), vx: rand(-40, 40),
      s: rand(6, 14), hue: rand(0, 360), rot: rand(0, TAU), spin: rand(-4, 4), kind: Math.floor(rand(0, 3))
    });
  }
}
function updateParticles(dt) {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.vy += p.grav * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.rot += dt * 4;
  }
}

/* ------------------------------------------------------------------ */
/* physics                                                             */
/* ------------------------------------------------------------------ */
function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function updatePlayer(dt) {
  var p = player;

  // move bobbing platforms first, and carry whoever stands on them
  for (var i = 0; i < level.plats.length; i++) {
    var pl = level.plats[i];
    if (pl.bob) {
      var ny = pl.baseY + Math.sin(t * pl.bobSpeed + pl.phase) * pl.bob;
      pl.dy = ny - pl.y;
      pl.y = ny;
    } else pl.dy = 0;
  }
  if (p.standingOn && p.standingOn.dy) p.y += p.standingOn.dy;

  // horizontal
  var dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  var acc = p.onGround ? MOVE_ACC : AIR_ACC;
  if (dir !== 0) {
    p.vx += dir * acc * dt;
    p.face = dir;
  } else {
    var f = FRICTION * dt;
    if (Math.abs(p.vx) <= f) p.vx = 0; else p.vx -= Math.sign(p.vx) * f;
  }
  p.vx = clamp(p.vx, -MAX_SPEED, MAX_SPEED);
  p.walking = p.onGround && Math.abs(p.vx) > 30;

  // jumping — double jump, coyote time, and a jump buffer so it always feels fair
  if (input.jumpQueued > 0) input.jumpQueued -= dt;
  var canGroundJump = p.onGround || p.coyote > 0;
  if (input.jumpQueued > 0 && (canGroundJump || p.jumpsLeft > 0)) {
    var second = !canGroundJump;
    p.vy = -JUMP_V * (second ? 0.88 : 1);
    p.onGround = false; p.coyote = 0;
    p.jumpsLeft = second ? 0 : 1;
    input.jumpQueued = 0;
    p.squash = 0.78;
    sfxJump();
    burst(p.x + p.w / 2, p.y + p.h, second ? 14 : 8,
      second ? 'rgba(255,220,120,0.95)' : 'rgba(180,240,255,0.9)', { speed: second ? 220 : 130, grav: 200 });
  }
  // short hop when the button is released early
  if (!input.jumpHeld && p.vy < -220) p.vy = -220;

  p.vy += GRAVITY * dt;
  p.vy = Math.min(p.vy, 1400);

  // --- collide X (jump-through ledges never block you sideways)
  var prevBottom = p.y + p.h;
  p.x += p.vx * dt;
  for (var a = 0; a < level.plats.length; a++) {
    var q = level.plats[a];
    if (q.oneWay) continue;
    if (overlaps(p.x, p.y, p.w, p.h, q.x, q.y, q.w, q.h)) {
      if (p.vx > 0) p.x = q.x - p.w;
      else if (p.vx < 0) p.x = q.x + q.w;
      p.vx = 0;
    }
  }
  // --- collide Y
  var wasOnGround = p.onGround;
  p.onGround = false;
  p.standingOn = null;
  p.y += p.vy * dt;
  for (var b = 0; b < level.plats.length; b++) {
    var r = level.plats[b];
    // a jump-through ledge only catches you on the way down, from above it
    if (r.oneWay && (p.vy <= 0 || prevBottom > r.y + 10)) continue;
    if (overlaps(p.x, p.y, p.w, p.h, r.x, r.y, r.w, r.h)) {
      if (p.vy > 0) {
        p.y = r.y - p.h;
        if (p.vy > 480) { p.squash = 1.22; burst(p.x + p.w / 2, p.y + p.h, 8, 'rgba(190,235,255,0.8)', { speed: 130, grav: 300 }); }
        p.vy = 0; p.onGround = true; p.standingOn = r; p.jumpsLeft = 2;
      } else if (p.vy < 0) {
        p.y = r.y + r.h;
        p.vy = 60;
      }
    }
  }
  if (p.onGround) p.coyote = COYOTE; else p.coyote = Math.max(0, p.coyote - dt);
  if (p.onGround && !wasOnGround) p.squash = Math.max(p.squash, 1.15);
  p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0008, dt));

  // remember a safe spot to float back to
  p.safeTimer -= dt;
  if (p.onGround && p.safeTimer <= 0) {
    p.safe.x = p.x; p.safe.y = p.y - 4; p.safeTimer = 0.25;
  }
  // keep inside the level
  p.x = clamp(p.x, 0, level.width - p.w);

  // fell in a hole? float gently home. Nobody ever loses this game.
  if (p.y > LEVEL_H + 120) {
    burst(p.x + p.w / 2, LEVEL_H, 24, 'rgba(150, 220, 255, 0.9)', { speed: 200, grav: -60, life: 1.1 });
    p.x = p.safe.x; p.y = p.safe.y - 30; p.vx = 0; p.vy = 0; p.jumpsLeft = 2;
    burst(p.x + p.w / 2, p.y + p.h / 2, 24, 'rgba(255, 240, 180, 0.9)', { speed: 180, grav: -40, life: 1.0 });
    blip(midi(72), 0.4, 'sine', 0.15);
  }
}

/* ------------------------------------------------------------------ */
/* pick-ups                                                            */
/* ------------------------------------------------------------------ */
function tryCollect(list, radius, onGet) {
  var cx = player.x + player.w / 2, cy = player.y + player.h / 2;
  for (var i = 0; i < list.length; i++) {
    var it = list[i];
    it.t += 0.016;
    if (it.got) { it.pop += 0.016; continue; }
    var dx = it.x - cx, dy = it.y - cy;
    if (dx * dx + dy * dy < radius * radius) {
      it.got = true; it.pop = 0;
      onGet(it);
    }
  }
}

function updateItems(dt) {
  tryCollect(level.crystals, 42, function (it) {
    totals.crystals++; levelCount.crystals++;
    burst(it.x, it.y, 12, 'rgba(150, 235, 255, 0.95)', { speed: 170, grav: 120 });
    chime();
  });
  tryCollect(level.notes, 44, function (it) {
    totals.notes++; levelCount.notes++;
    burst(it.x, it.y, 14, 'hsla(' + ((t * 60) % 360) + ', 100%, 75%, 0.95)', { speed: 190, grav: 60 });
    chime(); blip(midi(PENTA[pentaStep] + 7), 0.5, 'sine', 0.12);
  });
  tryCollect(level.hearts, 46, function (it) {
    totals.hearts++; levelCount.hearts++;
    burst(it.x, it.y, 16, 'rgba(255, 130, 190, 0.95)', { speed: 180, grav: 40 });
    sfxHeart();
  });
  tryCollect(level.gems, 46, function (it) {
    totals.gems++; levelCount.gems++;
    burst(it.x, it.y, 18, 'hsla(' + Math.round(it.hue) + ', 100%, 75%, 0.95)', { speed: 220, grav: 90 });
    chime(); blip(midi(PENTA[Math.min(pentaStep + 2, PENTA.length - 1)] + 12), 0.4, 'triangle', 0.14);
  });

  // trolls
  var cx = player.x + player.w / 2, cy = player.y + player.h / 2;
  for (var i = 0; i < level.trolls.length; i++) {
    var tr = level.trolls[i];
    tr.t += dt;
    if (tr.freed) continue;
    var dx = tr.x - cx, dy = (tr.y - 26) - cy;
    if (dx * dx + dy * dy < 56 * 56) {
      tr.freed = true;
      totals.trolls++; levelCount.trolls++;
      parade.push({ hue: tr.hue, t: rand(0, TAU) });
      burst(tr.x, tr.y - 30, 22, 'hsla(' + Math.round(tr.hue) + ', 100%, 75%, 0.95)', { speed: 220, grav: 90 });
      burst(tr.x, tr.y - 30, 6, 'rgba(255,150,200,0.95)', { speed: 130, grav: -30, life: 1.2 });
      sfxTroll();
      toast('A troll friend! ' + totals.trolls + ' in your parade');
    }
  }

  // portal
  if (Math.abs(cx - level.portal.x) < 60 && Math.abs(cy - (level.portal.y - 110)) < 110) {
    state = 'levelclear';
    clearTimer = 0;
    makeConfetti(50);
    sfxWin();
  }
}

/* the parade of rescued trolls follows the player's footsteps */
function updateTrail() {
  trail.unshift({ x: player.x + player.w / 2, y: player.y + player.h, f: player.face });
  var need = (Math.min(parade.length, 14) + 1) * 15 + 6;
  while (trail.length > need) trail.pop();
}

/* ------------------------------------------------------------------ */
/* background                                                          */
/* ------------------------------------------------------------------ */
function drawSky(tint) {
  var g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'hsl(' + (250 + tint * 0.1) + ', 62%, 16%)');
  g.addColorStop(0.45, 'hsl(' + (238 + tint * 0.12) + ', 60%, 30%)');
  g.addColorStop(0.78, 'hsl(' + (212 + tint * 0.1) + ', 72%, 48%)');
  g.addColorStop(1, 'hsl(' + (330 - tint * 0.05) + ', 70%, 66%)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawStars() {
  for (var i = 0; i < 90; i++) {
    var sx = (hash(i) * 2400 - cam.x * 0.18) % 1200;
    if (sx < 0) sx += 1200;
    sx = sx * 0.8;
    var sy = hash(i + 99) * 360 - cam.y * 0.15;
    var tw = 0.35 + 0.65 * (Math.sin(t * 2 + i * 1.7) * 0.5 + 0.5);
    ctx.fillStyle = 'rgba(255,255,255,' + (tw * 0.9) + ')';
    ctx.beginPath(); ctx.arc(sx, sy, 1 + hash(i + 5) * 1.4, 0, TAU); ctx.fill();
  }
}

// jewels and diamonds hanging in the sky, far away
function drawSkyJewels() {
  for (var i = 0; i < 40; i++) {
    var px = (hash(i * 3.1) * 3000 - cam.x * 0.32);
    px = ((px % 1600) + 1600) % 1600 - 200;
    var py = 40 + hash(i * 7.7) * 330 - cam.y * 0.25;
    var s = 12 + hash(i * 2.3) * 20;
    var hue = hash(i * 5.5) * 360;
    ctx.save();
    ctx.globalAlpha = 0.5 + hash(i) * 0.35;
    drawGem(px, py, s, t * 0.6 + i, hue);
    ctx.restore();
  }
}

function drawMountains() {
  // far crystal ridge
  var off = cam.x * 0.35;
  ctx.fillStyle = 'rgba(40, 60, 150, 0.55)';
  ctx.beginPath();
  ctx.moveTo(-100, H);
  for (var x = -100; x <= W + 100; x += 20) {
    var wx = x + off;
    var y = 300 - cam.y * 0.3 + Math.sin(wx * 0.004) * 70 + Math.sin(wx * 0.011 + 1.7) * 34;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W + 100, H); ctx.closePath(); ctx.fill();

  // near ridge with crystal spikes
  var off2 = cam.x * 0.55;
  ctx.fillStyle = 'rgba(24, 36, 110, 0.75)';
  ctx.beginPath();
  ctx.moveTo(-100, H);
  for (var x2 = -100; x2 <= W + 100; x2 += 16) {
    var wx2 = x2 + off2;
    var y2 = 400 - cam.y * 0.45 + Math.sin(wx2 * 0.0055 + 0.6) * 60 + Math.sin(wx2 * 0.017) * 22;
    ctx.lineTo(x2, y2);
  }
  ctx.lineTo(W + 100, H); ctx.closePath(); ctx.fill();
}

function drawClouds() {
  for (var i = 0; i < 10; i++) {
    var px = (hash(i * 11.3) * 2600 - cam.x * 0.42);
    px = ((px % 1700) + 1700) % 1700 - 250;
    var py = 90 + hash(i * 4.1) * 300 - cam.y * 0.35;
    var s = 40 + hash(i * 8.9) * 60;
    ctx.fillStyle = 'rgba(190, 215, 255, ' + (0.10 + hash(i) * 0.10) + ')';
    ctx.beginPath();
    ctx.ellipse(px, py, s * 1.8, s * 0.6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px - s * 0.6, py + s * 0.12, s * 0.9, s * 0.45, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + s * 0.7, py + s * 0.1, s * 1.0, s * 0.5, 0, 0, TAU); ctx.fill();
  }
}

/* ------------------------------------------------------------------ */
/* HUD                                                                 */
/* ------------------------------------------------------------------ */
function drawCounter(x, y, drawIcon, value, iconScale) {
  drawIcon(x, y, iconScale || 11, t);
  ctx.font = 'bold 22px "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(10,16,50,0.85)';
  ctx.fillText(String(value), x + 20, y + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(value), x + 19, y);
}

function drawHUD() {
  ctx.save();
  ctx.fillStyle = 'rgba(14, 22, 66, 0.42)';
  rr(14, 12, 452, 46, 22); ctx.fill();
  ctx.strokeStyle = 'rgba(170, 225, 255, 0.35)'; ctx.lineWidth = 2; ctx.stroke();

  var y = 35;
  drawCounter(44, y, function (x, yy, s, tt) { drawCrystal(x, yy, s * 0.85, tt); }, totals.crystals);
  drawCounter(132, y, function (x, yy, s, tt) { drawNote(x, yy - 2, s, tt); }, totals.notes);
  drawCounter(220, y, function (x, yy, s, tt) { drawHeart(x, yy, s, tt); }, totals.hearts);
  drawCounter(308, y, function (x, yy, s, tt) { drawGem(x, yy - 2, s, tt, 285); }, totals.gems);
  drawCounter(396, y, function (x, yy, s, tt) { drawTroll(x, yy + 13, s * 1.05, tt, 200, { noShadow: true }); }, totals.trolls);

  // level name, right side
  ctx.font = 'bold 20px "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(10,16,50,0.6)';
  ctx.fillText(level.name, W - 21, 36);
  ctx.fillStyle = 'rgba(220, 240, 255, 0.95)';
  ctx.fillText(level.name, W - 22, 34);

  if (toastTime > 0) {
    var a = clamp(toastTime, 0, 1);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(10,16,50,0.55)';
    ctx.fillText(toastText, W / 2 + 2, 104);
    ctx.fillStyle = '#fff6ff';
    ctx.fillText(toastText, W / 2, 102);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawConfetti(dt) {
  for (var i = 0; i < confetti.length; i++) {
    var c = confetti[i];
    c.y += c.vy * dt; c.x += c.vx * dt; c.rot += c.spin * dt;
    if (c.y > H + 30) { c.y = -20; c.x = rand(0, W); }
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    if (c.kind === 0) drawGem(0, 0, c.s * 0.9, t + i, c.hue);
    else if (c.kind === 1) { ctx.fillStyle = 'hsl(' + c.hue + ',100%,72%)'; heartPath(c.s * 0.8); ctx.fill(); }
    else sparkle(0, 0, c.s, 'hsla(' + c.hue + ',100%,80%,0.95)');
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ */
/* screens                                                             */
/* ------------------------------------------------------------------ */
function panel(x, y, w, h) {
  ctx.fillStyle = 'rgba(16, 22, 70, 0.82)';
  rr(x, y, w, h, 28); ctx.fill();
  ctx.strokeStyle = 'rgba(170, 230, 255, 0.6)'; ctx.lineWidth = 3; ctx.stroke();
}
function bigText(text, x, y, size, color) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold ' + size + 'px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(8, 10, 40, 0.55)';
  ctx.fillText(text, x + 3, y + 3);
  ctx.fillStyle = color || '#ffffff';
  ctx.fillText(text, x, y);
}

function drawTitle(dt) {
  drawSky(0);
  drawStars();
  drawSkyJewels();
  drawMountains();
  drawClouds();

  // a row of happy trolls waving at the bottom
  for (var i = 0; i < 7; i++) {
    var x = 100 + i * 130;
    drawTroll(x, 504 + Math.sin(t * 2 + i) * 6, 34, t + i * 0.7, 186 + i * 7, { walking: true, face: i % 2 ? 1 : -1 });
  }
  for (var c = 0; c < 8; c++) drawCrystal(70 + c * 118, 452 + Math.sin(t * 1.4 + c) * 10, 13, t + c);

  bigText('SPARKLE TROLLS', W / 2, 150, 68, '#bff0ff');
  bigText('Crystal Sky Adventure', W / 2, 208, 30, '#ffd9f2');

  var a = 0.55 + Math.sin(t * 3) * 0.45;
  ctx.globalAlpha = a;
  bigText('Press SPACE to play', W / 2, 278, 32, '#fff2b0');
  ctx.globalAlpha = 1;
  ctx.font = '18px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(235, 245, 255, 0.85)';
  ctx.textAlign = 'center';
  ctx.fillText('← → or A D to walk   •   SPACE to jump (press again in the air to double jump)', W / 2, 322);
  ctx.fillText('M = music on/off   •   R = start the place again', W / 2, 346);
  ctx.fillText('1  2  3  =  start at Crystal Meadow, Jewel Sky or Rainbow Peak', W / 2, 370);
}

function drawLevelClear(dt) {
  drawConfetti(dt);
  panel(W / 2 - 300, 90, 600, 360);
  bigText('YAY!', W / 2, 150, 56, '#ffe9a8');
  bigText(level.name + ' complete', W / 2, 200, 26, '#cfefff');

  var y = 254, x0 = W / 2 - 200;
  var many = function (n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); };
  var rows = [
    [function (a, b, s, tt) { drawCrystal(a, b, s, tt); }, 'crystal', levelCount.crystals, totals.crystals],
    [function (a, b, s, tt) { drawNote(a, b, s, tt); }, 'magic note', levelCount.notes, totals.notes],
    [function (a, b, s, tt) { drawHeart(a, b, s, tt); }, 'heart', levelCount.hearts, totals.hearts],
    [function (a, b, s, tt) { drawGem(a, b, s, tt, 290); }, 'jewel', levelCount.gems, totals.gems],
    [function (a, b, s, tt) { drawTroll(a, b + 14, s, tt, 200, { noShadow: true }); }, 'troll friend', levelCount.trolls, totals.trolls]
  ];
  ctx.textBaseline = 'middle';
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i], ry = y + i * 33;
    r[0](x0, ry, 11, t);
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillStyle = '#eaf6ff';
    ctx.fillText(many(r[2], r[1]), x0 + 24, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(180, 220, 255, 0.75)';
    ctx.fillText('total ' + r[3], W / 2 + 200, ry);
  }
  ctx.globalAlpha = 0.55 + Math.sin(t * 3) * 0.45;
  bigText(levelIndex + 1 < LEVEL_BUILDERS.length ? 'Press SPACE for the next place' : 'Press SPACE to finish', W / 2, 424, 24, '#fff2b0');
  ctx.globalAlpha = 1;
}

function drawWin(dt) {
  drawSky(200);
  drawStars();
  drawSkyJewels();
  drawMountains();
  drawConfetti(dt);

  // the whole parade dances
  var n = Math.min(parade.length, 16);
  for (var i = 0; i < n; i++) {
    var x = (W / (n + 1)) * (i + 1);
    var yy = 430 + Math.sin(t * 4 + i * 0.8) * 22;
    drawTroll(x, yy, 34, t + i, parade[i].hue, { walking: true, face: Math.sin(t * 2 + i) > 0 ? 1 : -1 });
  }
  drawTroll(W / 2, 350 + Math.sin(t * 4) * 26, 44, t, 0, { rainbow: true, heartBelly: true, walking: true });

  panel(W / 2 - 320, 70, 640, 210);
  bigText('YOU DID IT!', W / 2, 130, 60, '#ffe9a8');
  bigText('You rescued ' + totals.trolls + ' troll friend' + (totals.trolls === 1 ? '' : 's'), W / 2, 184, 28, '#cfefff');
  bigText(totals.crystals + ' crystals  •  ' + totals.notes + ' notes  •  ' + totals.hearts + ' hearts  •  ' + totals.gems + ' jewels',
    W / 2, 228, 22, '#bfe6ff');
  ctx.globalAlpha = 0.55 + Math.sin(t * 3) * 0.45;
  bigText('Press SPACE to play again', W / 2, 512, 24, '#fff2b0');
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* world drawing                                                       */
/* ------------------------------------------------------------------ */
function visible(x, pad) { return x > cam.x - (pad || 80) && x < cam.x + W + (pad || 80); }

function drawWorld(dt) {
  drawSky(level.tint);
  drawStars();
  drawSkyJewels();
  drawMountains();
  drawClouds();

  ctx.save();
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

  // portal sits behind everything else in the world
  drawPortal(level.portal.x, level.portal.y, t);

  var i;
  for (i = 0; i < level.plats.length; i++) {
    var pl = level.plats[i];
    if (pl.x + pl.w > cam.x - 60 && pl.x < cam.x + W + 60) drawPlatform(pl, t);
  }

  // pick-ups
  for (i = 0; i < level.gems.length; i++) { var g1 = level.gems[i]; if (!g1.got && visible(g1.x)) drawGem(g1.x, g1.y, 17, g1.t, g1.hue); }
  for (i = 0; i < level.crystals.length; i++) { var c1 = level.crystals[i]; if (!c1.got && visible(c1.x)) drawCrystal(c1.x, c1.y, 13, c1.t); }
  for (i = 0; i < level.notes.length; i++) { var n1 = level.notes[i]; if (!n1.got && visible(n1.x)) drawNote(n1.x, n1.y, 15, n1.t); }
  for (i = 0; i < level.hearts.length; i++) { var h1 = level.hearts[i]; if (!h1.got && visible(h1.x)) drawHeart(h1.x, h1.y, 15, h1.t); }

  // trolls still waiting to be found
  for (i = 0; i < level.trolls.length; i++) {
    var tr = level.trolls[i];
    if (tr.freed || !visible(tr.x, 120)) continue;
    glow(tr.x, tr.y - 34, 60, 'hsla(' + Math.round(tr.hue) + ', 100%, 70%, 0.22)');
    drawTroll(tr.x, tr.y, 27, tr.t, tr.hue, {});
    // "here I am!" bubble
    var by = tr.y - 96 + Math.sin(tr.t * 3) * 5;
    sparkle(tr.x, by, 8 + Math.sin(tr.t * 5) * 3, 'rgba(255,255,255,0.85)');
  }

  // the parade following you
  var pn = Math.min(parade.length, 14);
  for (i = pn - 1; i >= 0; i--) {
    var idx = (i + 1) * 15;
    var pt = trail[Math.min(idx, trail.length - 1)];
    if (!pt) continue;
    drawTroll(pt.x, pt.y, 22, t + parade[i].t, parade[i].hue, { walking: true, face: pt.f });
    if (Math.sin(t * 2 + i * 2.1) > 0.985) {
      burst(pt.x, pt.y - 40, 3, 'rgba(255,150,200,0.9)', { speed: 60, grav: -60, life: 1.0, size: 4 });
    }
  }

  // particles
  for (i = 0; i < particles.length; i++) {
    var p2 = particles[i];
    ctx.globalAlpha = clamp(p2.life * 1.6, 0, 1);
    sparkle(p2.x, p2.y, p2.size, p2.color, p2.rot);
  }
  ctx.globalAlpha = 1;

  // you!
  drawTroll(player.x + player.w / 2, player.y + player.h, 28, t, 0,
    { rainbow: true, heartBelly: true, walking: player.walking, face: player.face, squash: player.squash });

  ctx.restore();
  drawHUD();
}

/* ------------------------------------------------------------------ */
/* main loop                                                           */
/* ------------------------------------------------------------------ */
function tick(dt) {
  t += dt;
  if (toastTime > 0) toastTime -= dt;
  if (pentaTimer > 0) { pentaTimer -= dt; if (pentaTimer <= 0) pentaStep = 0; }
  updateMusic();

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  if (state === 'title') {
    drawTitle(dt);
  } else if (state === 'play') {
    updatePlayer(dt);
    updateItems(dt);
    updateTrail();
    updateParticles(dt);
    // camera
    var targetX = clamp(player.x + player.w / 2 - W / 2, 0, Math.max(0, level.width - W));
    var targetY = clamp(player.y + player.h / 2 - H / 2 + 40, 0, LEVEL_H - H);
    var k = 1 - Math.pow(0.0015, dt);
    cam.x = lerp(cam.x, targetX, k);
    cam.y = lerp(cam.y, targetY, k);
    drawWorld(dt);
  } else if (state === 'levelclear') {
    clearTimer += dt;
    drawWorld(dt);
    ctx.fillStyle = 'rgba(8, 10, 40, 0.45)';
    ctx.fillRect(0, 0, W, H);
    drawLevelClear(dt);
  } else if (state === 'win') {
    drawWin(dt);
  }
}

var last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (!last) last = now;
  var dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  tick(dt);
}
requestAnimationFrame(frame);

// small hook for poking at the game from the browser console while developing
window.SparkleTrolls = {
  tick: tick,
  start: startGame,
  goToLevel: startLevel,
  get state() { return state; },
  get player() { return player; },
  get input() { return input; },
  get totals() { return totals; },
  get level() { return level; }
};

})();
