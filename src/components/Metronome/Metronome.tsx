import { useCallback, useEffect, useRef, useState } from 'react';
import './Metronome.css';

const MIN_BPM = 20;
const MAX_BPM = 300;
const SCHEDULE_AHEAD = 0.1;   // seconds to schedule ahead
const SCHEDULER_INTERVAL = 25; // ms between scheduler calls

function clampBpm(v: number) {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(v)));
}

function scheduleClick(ctx: AudioContext, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = 1000;
  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

  osc.start(time);
  osc.stop(time + 0.04);
}

export default function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const nextBeatRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bpmRef = useRef(bpm);
  const beatFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep bpmRef in sync so the scheduler always reads the latest value
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  const stopScheduler = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const scheduler = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    while (nextBeatRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const beatTime = nextBeatRef.current;

      scheduleClick(ctx, beatTime);

      // Flash the beat indicator at the right time
      const delay = Math.max(0, (beatTime - ctx.currentTime) * 1000);
      setTimeout(() => {
        setBeat(true);
        if (beatFlashRef.current) clearTimeout(beatFlashRef.current);
        beatFlashRef.current = setTimeout(() => setBeat(false), 80);
      }, delay);

      nextBeatRef.current += 60 / bpmRef.current;
    }

    timerRef.current = setTimeout(scheduler, SCHEDULER_INTERVAL);
  }, []);

  const start = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    nextBeatRef.current = ctx.currentTime;
    setIsPlaying(true);
    scheduler();
  }, [scheduler]);

  const stop = useCallback(() => {
    stopScheduler();
    setIsPlaying(false);
    setBeat(false);
  }, [stopScheduler]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScheduler();
      if (beatFlashRef.current) clearTimeout(beatFlashRef.current);
    };
  }, [stopScheduler]);

  function handleBpmInput(e: React.ChangeEvent<HTMLInputElement>) {
    setBpm(clampBpm(Number(e.target.value)));
  }

  function nudge(delta: number) {
    setBpm(prev => clampBpm(prev + delta));
  }

  return (
    <div className="metronome">
      <div className="metronome__header">
        <span className="metronome__title">Metronome</span>
        <span className={`metronome__beat-dot ${beat ? 'metronome__beat-dot--on' : ''}`} />
      </div>

      <div className="metronome__controls">
        <div className="metronome__bpm-row">
          <button className="metronome__nudge" onClick={() => nudge(-5)} aria-label="Decrease BPM by 5">−5</button>
          <button className="metronome__nudge" onClick={() => nudge(-1)} aria-label="Decrease BPM by 1">−1</button>
          <div className="metronome__bpm-display">
            <input
              type="number"
              className="metronome__bpm-input"
              value={bpm}
              min={MIN_BPM}
              max={MAX_BPM}
              onChange={handleBpmInput}
              aria-label="Beats per minute"
            />
            <span className="metronome__bpm-label">BPM</span>
          </div>
          <button className="metronome__nudge" onClick={() => nudge(1)} aria-label="Increase BPM by 1">+1</button>
          <button className="metronome__nudge" onClick={() => nudge(5)} aria-label="Increase BPM by 5">+5</button>
        </div>

        <input
          type="range"
          className="metronome__slider"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={handleBpmInput}
          aria-label="BPM slider"
        />

        <button
          className={`metronome__toggle ${isPlaying ? 'metronome__toggle--stop' : 'metronome__toggle--start'}`}
          onClick={isPlaying ? stop : start}
        >
          {isPlaying ? '⏹ Stop' : '▶ Start'}
        </button>
      </div>
    </div>
  );
}
