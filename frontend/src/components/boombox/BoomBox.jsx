import { useEffect, useState } from "react";
import "./BoomBox.css";

const STORAGE_KEY = "rotation:music";
const VOLUME = 0.35;

/* The playlist. Tracks play in order and wrap round forever, so add another
   file here and it joins the rotation. */
const PLAYLIST = ["/audio/theme.mp3", "/audio/theme2.mp3"];

/* Module level, not component state: StrictMode mounts, unmounts and remounts
   in development, and a per-component element would be torn down and recreated
   mid-playback. One element survives all of that. */
let track = null;
let index = 0;

const getTrack = () => {
  if (!track && typeof Audio !== "undefined") {
    track = new Audio(PLAYLIST[index]);
    track.volume = VOLUME;
    track.preload = "auto";
    // Looping is handled across the playlist, not within one file.
    track.loop = false;
    track.addEventListener("ended", () => {
      index = (index + 1) % PLAYLIST.length;
      track.src = PLAYLIST[index];
      track.play().catch(() => {});
    });
  }
  return track;
};

const attemptPlay = async () => {
  const element = getTrack();
  if (!element) return false;
  try {
    await element.play();
    return true;
  } catch {
    // Rejected until the page has been interacted with.
    return false;
  }
};

/* Music note, drawn inline so it stays crisp and inherits the button colour. */
const NoteIcon = () => (
  <svg
    className="boombox__note"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M9 17.5V6.2l10-2v9.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6.6" cy="17.6" r="2.7" fill="currentColor" />
    <circle cx="16.6" cy="15.6" r="2.7" fill="currentColor" />
  </svg>
);

export const BoomBox = () => {
  const [playing, setPlaying] = useState(() => !getTrack()?.paused);

  /* Drive the UI from what the element is actually doing, so the label can
     never disagree with what you hear. */
  useEffect(() => {
    const element = getTrack();
    if (!element) return undefined;

    const sync = () => setPlaying(!element.paused);
    element.addEventListener("play", sync);
    element.addEventListener("pause", sync);
    sync();

    return () => {
      element.removeEventListener("play", sync);
      element.removeEventListener("pause", sync);
    };
  }, []);

  /* Plays by default. Autoplay with sound is blocked until the visitor
     interacts, so if the first attempt is refused, start on their next
     gesture instead. */
  useEffect(() => {
    let muted = false;
    try {
      muted = localStorage.getItem(STORAGE_KEY) === "off";
    } catch { /* unreadable storage counts as not muted */ }
    if (muted) return undefined;

    const element = getTrack();
    if (!element || !element.paused) return undefined;

    const events = ["pointerdown", "keydown", "touchstart", "scroll"];
    const onGesture = () => {
      attemptPlay().then((ok) => ok && detach());
    };
    const detach = () =>
      events.forEach((e) => window.removeEventListener(e, onGesture));

    attemptPlay().then((ok) => {
      if (!ok) events.forEach((e) => window.addEventListener(e, onGesture));
    });

    return detach;
  }, []);

  const toggle = async () => {
    const element = getTrack();
    if (!element) return;

    if (!element.paused) {
      element.pause();
      try {
        localStorage.setItem(STORAGE_KEY, "off");
      } catch { /* ignore */ }
      return;
    }

    if (await attemptPlay()) {
      try {
        localStorage.setItem(STORAGE_KEY, "on");
      } catch { /* ignore */ }
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`boombox ${playing ? "boombox--on" : ""}`}
      aria-pressed={playing}
      aria-label={playing ? "Mute background music" : "Play background music"}
      title={playing ? "Mute" : "Play music"}
    >
      {playing ? (
        <span className="boombox__eq" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      ) : (
        <NoteIcon />
      )}
      <span className="boombox__label">{playing ? "MUTE" : "PLAY"}</span>
    </button>
  );
};
