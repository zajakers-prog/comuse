'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// Notes displayed top→bottom (high→low)
const NOTES = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'G3'];
const NOTE_LABELS: Record<string, string> = {
  'C5': 'C5', 'B4': 'B4', 'A4': 'A4', 'G4': 'G4', 'F4': 'F4',
  'E4': 'E4', 'D4': 'D4', 'C4': 'C4', 'B3': 'B3', 'A3': 'A3', 'G3': 'G3',
};
const BLACK_NOTES = new Set(['B4', 'A4', 'G4', 'E4', 'D4', 'B3', 'A3', 'G3']);
const STEPS = 16;
const INSTRUMENTS = [
  { id: 'piano', label: 'Piano', emoji: '🎹' },
  { id: 'synth', label: 'Synth', emoji: '🎛️' },
  { id: 'guitar', label: 'Guitar', emoji: '🎸' },
  { id: 'strings', label: 'Strings', emoji: '🎻' },
];

export interface MusicData {
  type: 'music';
  bpm: number;
  instrument: string;
  grid: boolean[][]; // [noteIndex][step]
  lyrics: string;
}

export function emptyMusicData(): MusicData {
  return {
    type: 'music',
    bpm: 100,
    instrument: 'piano',
    grid: NOTES.map(() => Array(STEPS).fill(false)),
    lyrics: '',
  };
}

interface MusicEditorProps {
  initialData?: MusicData;
  onChange?: (data: MusicData) => void;
  readOnly?: boolean;
}

export function MusicEditor({ initialData, onChange, readOnly = false }: MusicEditorProps) {
  const [data, setData] = useState<MusicData>(initialData ?? emptyMusicData());
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const toneRef = useRef<typeof import('tone') | null>(null);
  const synthRef = useRef<any>(null);
  const seqRef = useRef<any>(null);
  const [toneLoaded, setToneLoaded] = useState(false);

  // Lazy load Tone.js (SSR safe)
  useEffect(() => {
    import('tone').then((Tone) => {
      toneRef.current = Tone;
      setToneLoaded(true);
    });
    return () => {
      seqRef.current?.stop();
      seqRef.current?.dispose();
      synthRef.current?.dispose();
    };
  }, []);

  const update = useCallback((patch: Partial<MusicData>) => {
    setData(prev => {
      const next = { ...prev, ...patch };
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  const toggleCell = useCallback((noteIdx: number, step: number) => {
    if (readOnly) return;
    setData(prev => {
      const grid = prev.grid.map(row => [...row]);
      grid[noteIdx][step] = !grid[noteIdx][step];
      const next = { ...prev, grid };
      onChange?.(next);
      return next;
    });
  }, [readOnly, onChange]);

  const buildSynth = useCallback((Tone: typeof import('tone'), instrument: string) => {
    synthRef.current?.dispose();
    if (instrument === 'piano') {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
      }).toDestination();
    } else if (instrument === 'synth') {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.5 },
      }).toDestination();
    } else if (instrument === 'guitar') {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.6 },
      }).toDestination();
    } else {
      // strings
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.2, decay: 0.1, sustain: 0.9, release: 1.2 },
      }).toDestination();
    }
  }, []);

  const handlePlay = useCallback(async () => {
    const Tone = toneRef.current;
    if (!Tone) return;
    await Tone.start();

    if (playing) {
      seqRef.current?.stop();
      seqRef.current?.dispose();
      Tone.getTransport().stop();
      setPlaying(false);
      setCurrentStep(-1);
      return;
    }

    buildSynth(Tone, data.instrument);
    Tone.getTransport().bpm.value = data.bpm;

    let step = 0;
    seqRef.current?.dispose();
    seqRef.current = new Tone.Sequence(
      (time: number) => {
        const s = step;
        setCurrentStep(s);
        NOTES.forEach((note, noteIdx) => {
          if (data.grid[noteIdx][s]) {
            synthRef.current?.triggerAttackRelease(note, '8n', time);
          }
        });
        step = (step + 1) % STEPS;
      },
      [...Array(STEPS).keys()],
      '8n'
    );

    seqRef.current.start(0);
    Tone.getTransport().start();
    setPlaying(true);
  }, [playing, data, buildSynth]);

  // Stop when unmounted
  useEffect(() => {
    return () => {
      if (playing) {
        seqRef.current?.stop();
        toneRef.current?.getTransport().stop();
      }
    };
  }, [playing]);

  const isBlack = (note: string) => BLACK_NOTES.has(note);

  return (
    <div className="bg-gray-900 rounded-2xl p-5 space-y-4 select-none">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Instrument */}
        <div className="flex gap-1">
          {INSTRUMENTS.map(inst => (
            <button
              key={inst.id}
              onClick={() => !readOnly && update({ instrument: inst.id })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                data.instrument === inst.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              } ${readOnly ? 'cursor-default' : ''}`}
            >
              {inst.emoji} {inst.label}
            </button>
          ))}
        </div>

        {/* BPM */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-gray-400 text-sm">BPM</span>
          <input
            type="range"
            min={60}
            max={180}
            value={data.bpm}
            onChange={e => !readOnly && update({ bpm: Number(e.target.value) })}
            disabled={readOnly}
            className="w-24 accent-indigo-500"
          />
          <span className="text-white text-sm font-mono w-8">{data.bpm}</span>
        </div>

        {/* Play */}
        <button
          onClick={handlePlay}
          disabled={!toneLoaded}
          className={`w-10 h-10 rounded-full font-bold text-lg flex items-center justify-center transition ${
            playing
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          } disabled:opacity-40`}
        >
          {playing ? '⏹' : '▶'}
        </button>
      </div>

      {/* Piano Roll Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {NOTES.map((note, noteIdx) => (
            <div key={note} className="flex items-center gap-0.5 mb-0.5">
              {/* Note label (piano key) */}
              <div
                className={`w-10 text-xs font-mono text-right pr-2 flex-shrink-0 ${
                  isBlack(note) ? 'text-gray-500' : 'text-gray-300'
                }`}
              >
                {NOTE_LABELS[note]}
              </div>
              {/* Steps */}
              {Array.from({ length: STEPS }).map((_, step) => {
                const active = data.grid[noteIdx]?.[step];
                const isCurrent = step === currentStep && playing;
                return (
                  <button
                    key={step}
                    onClick={() => toggleCell(noteIdx, step)}
                    className={`w-7 h-7 rounded-sm border transition-all flex-shrink-0 ${
                      active
                        ? isCurrent
                          ? 'bg-yellow-300 border-yellow-200'
                          : 'bg-indigo-400 border-indigo-300'
                        : isCurrent
                          ? 'bg-gray-600 border-gray-500'
                          : step % 4 === 0
                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                            : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                    } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Measure labels */}
      <div className="flex ml-[2.75rem] gap-0.5">
        {Array.from({ length: STEPS }).map((_, i) => (
          <div key={i} className={`w-7 text-center text-xs flex-shrink-0 ${
            i % 4 === 0 ? 'text-gray-400' : 'text-transparent'
          }`}>
            {i % 4 === 0 ? i / 4 + 1 : '·'}
          </div>
        ))}
      </div>

      {/* Lyrics */}
      <div>
        <textarea
          value={data.lyrics}
          onChange={e => !readOnly && update({ lyrics: e.target.value })}
          readOnly={readOnly}
          placeholder={readOnly ? '' : '가사 또는 곡 설명을 입력하세요...'}
          rows={3}
          className="w-full bg-gray-800 text-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600"
        />
      </div>
    </div>
  );
}
