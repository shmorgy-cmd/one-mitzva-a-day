/**
 * audio.js — the speaker button next to each blessing.
 *
 * Each blessing line has a stable id: "b-<key>" for a blessing in BLESSINGS
 * (daily-guide.js), "t-<key>-<n>" for line n of a fixed text in PRAYER_TEXTS
 * (prayer-texts.js). recordings.html lists every id with its words and file name.
 *
 * Pressing the speaker plays the real recording when there is one; otherwise it
 * reads the Hebrew with the device's own Hebrew voice, if the device has one.
 * With neither, no speaker is shown. Either way God's name (ה׳) is spoken as
 * "Adoshem", as in practice recordings.
 */

/**
 * The recordings that exist. To add one: save it as audio/<id>.m4a (or .mp3)
 * and add a line here, e.g.  "b-hamotzi": "m4a",
 * When a recording is replaced, give it a version so phones fetch the new one:
 *   "b-hamotzi": { ext: "m4a", v: 2 },
 */
const AUDIO_RECORDINGS = {
};

const AUDIO_NAME_SPOKEN = "אֲדֹשֵׁם";

const SPEAKER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a.8.8 0 0 0 1.3-.6V5.5a.8.8 0 0 0-1.3-.6L8 8.5H5a1 1 0 0 0-1 1Z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/></svg>';
const STOP_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/></svg>';

/** The file for a line's recording (null when there isn't one yet). */
function audioRecording(id) {
  const r = id && AUDIO_RECORDINGS[id];
  if (!r) return null;
  const o = typeof r === "string" ? { ext: r } : r;
  return `audio/${id}.${o.ext || "m4a"}${o.v ? `?v=${o.v}` : ""}`;
}

/** Every recording's file, for saving them all for offline use. */
function allAudioRecordings() {
  return Object.keys(AUDIO_RECORDINGS).map(audioRecording).filter(Boolean);
}

// --- The device's Hebrew voice (a fallback) -----------------------------------

let heVoice = null;

function findHebrewVoice() {
  if (!("speechSynthesis" in window)) return null;
  return speechSynthesis.getVoices().find(v => /^(he|iw)\b/i.test(v.lang)) || null;
}

/** Voices load late on some browsers, so check again when they arrive. Shows the
 *  voice-only speakers (class spk--tts) only when a Hebrew voice exists. */
function initHebrewVoice() {
  if (!("speechSynthesis" in window)) return;
  const update = () => {
    heVoice = findHebrewVoice();
    document.body.classList.toggle("has-he-voice", !!heVoice);
  };
  update();
  if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", update);
  else speechSynthesis.onvoiceschanged = update;
}

/** The Hebrew as it should be read aloud: God's name as "Adoshem". */
function textForSpeech(he) {
  return he
    .replace(/ה׳/g, AUDIO_NAME_SPOKEN)
    .replace(/יְהֹוָה|יְהוָה|יהוה/g, AUDIO_NAME_SPOKEN)
    .replace(/[()]/g, "");
}

// --- Playing --------------------------------------------------------------------

let currentPlay = null; // { button, stop }

function setSpeakerState(button, playing) {
  button.classList.toggle("is-playing", playing);
  button.innerHTML = playing ? STOP_SVG : SPEAKER_SVG;
  button.setAttribute("aria-label", playing ? "Stop" : button.dataset.label);
}

function stopAudio() {
  if (!currentPlay) return;
  const p = currentPlay;
  currentPlay = null;
  try { p.stop(); } catch (e) { /* ignore */ }
  setSpeakerState(p.button, false);
}

/** Plays (or, if it's playing, stops) one line: the recording first, else the voice. */
async function playLine(button, id, he) {
  if (currentPlay && currentPlay.button === button) { stopAudio(); return; }
  stopAudio();
  const play = { button, stop: () => {} };
  currentPlay = play;
  setSpeakerState(button, true);
  const finished = () => { if (currentPlay === play) stopAudio(); };

  const src = audioRecording(id);
  if (src) {
    try {
      // Fetched whole (not streamed), so the service worker can keep a copy for offline.
      const res = await fetch(src);
      if (!res.ok) throw new Error("recording not found");
      const url = URL.createObjectURL(await res.blob());
      if (currentPlay !== play) { URL.revokeObjectURL(url); return; }
      const audio = new Audio(url);
      play.stop = () => { audio.pause(); URL.revokeObjectURL(url); };
      audio.onended = finished;
      audio.onerror = finished;
      await audio.play();
      return;
    } catch (e) {
      if (currentPlay !== play) return;
      // fall through to the device's voice
    }
  }
  if (heVoice) {
    const u = new SpeechSynthesisUtterance(textForSpeech(he));
    u.voice = heVoice;
    u.lang = heVoice.lang;
    u.rate = 0.8;
    u.onend = finished;
    u.onerror = finished;
    play.stop = () => speechSynthesis.cancel();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    return;
  }
  finished();
}

/** The speaker button for one line of Hebrew. */
function speakerButton(id, he) {
  const hasRecording = !!audioRecording(id);
  const b = document.createElement("button");
  b.type = "button";
  b.className = "spk " + (hasRecording ? "spk--rec" : "spk--tts");
  b.dataset.label = hasRecording ? "Listen" : "Listen (read by your device's voice)";
  b.title = b.dataset.label;
  setSpeakerState(b, false);
  b.addEventListener("click", (e) => {
    e.stopPropagation(); // don't also toggle the transliteration
    playLine(b, id, he);
  });
  return b;
}
