'use client';

import { useEffect, useRef, useState } from 'react';
import ChartComponent from './components/ChartComponent';
import SignalCombinationSelector from './components/SignalCombinationSelector';
import SimpleCard from './components/SimpleCard';
import useCamera from './hooks/useCamera';
import usePPGFromSamples from './hooks/usePPGFromSamples';
import {
  computePPGFromRGB,
  MIN_SAMPLES_FOR_DETECTION,
  SAMPLES_TO_KEEP,
} from './lib/ppg';
import type { SignalCombinationMode } from './components/SignalCombinationSelector';

export default function Home() {
  const { videoRef, canvasRef, isRecording, setIsRecording, error } =
    useCamera();
  const [samples, setSamples] = useState<number[]>([]);
  const [apiResponse, setApiResponse] = useState<object | null>(null);
  const { valleys, heartRate, hrv } = usePPGFromSamples(samples);
  const [signalCombination, setSignalCombination] =
    useState<SignalCombinationMode>('default');

  const [backendStatus, setBackendStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  type SegmentLabel = 'good' | 'bad';
  const [segmentLabel, setSegmentLabel] = useState<SegmentLabel>('good');
  const [segmentStatus, setSegmentStatus] = useState<string | null>(null);

  const [inferenceResult, setInferenceResult] = useState<{
    label: string | null;
    confidence: number;
    message?: string;
  } | null>(null);
  const [labeledSegments, setLabeledSegments] = useState<{
    ppgData: number[];
    label: string;
  }[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const samplesRef = useRef<number[]>([]);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const scalerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);

  useEffect(() => {
    setSamples([]);
    setInferenceResult(null);
  }, [signalCombination]);

  const INFERENCE_INTERVAL_MS = 2500;
  useEffect(() => {
    if (!isRecording) return;
    let cancelled = false;

    async function run() {
      const current = samplesRef.current;
      if (current.length < MIN_SAMPLES_FOR_DETECTION) return;
      const segment = current.slice(-SAMPLES_TO_KEEP);
      try {
        const res = await fetch('/api/infer-quality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ppgData: segment }),
        });
        const data = await res.json();
        if (!cancelled) {
          setInferenceResult({
            label: data.label ?? null,
            confidence: data.confidence ?? 0,
            message: data.message ?? data.error ?? undefined,
          });
        }
      } catch {
        if (!cancelled) {
          setInferenceResult({
            label: null,
            confidence: 0,
            message: 'Request failed',
          });
        }
      }
    }

    run();
    const id = setInterval(run, INFERENCE_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isRecording]);

  async function checkBackend() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setBackendStatus(
        data.ok ? 'Backend OK' : 'Backend returned unexpected data',
      );
    } catch {
      setBackendStatus('Backend unreachable');
    }
  }

  async function sendLabeledSegment() {
    if (samples.length < MIN_SAMPLES_FOR_DETECTION) {
      setSegmentStatus('Need more samples (start recording first)');
      return;
    }
    setSegmentStatus(null);
    const ppgSegment = samples.slice(-SAMPLES_TO_KEEP);

    try {
      const res = await fetch('/api/save-labeled-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ppgData: ppgSegment, label: segmentLabel }),
      });
      const data = await res.json();
      if (data.success) {
        setSegmentStatus(`Saved as ${segmentLabel}`);
        setLabeledSegments((prev) => [
          ...prev,
          { ppgData: ppgSegment, label: segmentLabel },
        ]);
      } else {
        setSegmentStatus('Error: ' + (data.error || 'Unknown'));
      }
    } catch {
      setSegmentStatus('Error: request failed');
    }
  }

  function downloadLabeledJson() {
    if (labeledSegments.length === 0) {
      alert('No labeled segments yet! Send some segments first.');
      return;
    }
    const json = JSON.stringify(labeledSegments, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'labeled_records.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleUploadModel() {
    const modelFile = modelInputRef.current?.files?.[0];
    const scalerFile = scalerInputRef.current?.files?.[0];

    if (!modelFile || !scalerFile) {
      setUploadStatus('Please select both model and scaler files');
      return;
    }

    setUploadStatus(null);

    try {
      const toBase64 = async (file: File) => {
        const buf = await file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buf);
        for (const byte of bytes) {
          binary += String.fromCharCode(byte);
        }
        return btoa(binary);
      };

      const model = await toBase64(modelFile);
      const scaler = await toBase64(scalerFile);

      const res = await fetch('/api/upload-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, scaler }),
      });

      const data = await res.json();
      setUploadStatus(
        res.ok && data.success
          ? 'Model and scaler uploaded successfully!'
          : 'Upload failed: ' + (data.error || 'Unknown error'),
      );
    } catch {
      setUploadStatus('Upload failed');
    }
  }

  async function saveRecord() {
    setSaveStatus(null);
    const record = {
      heartRate: { bpm: heartRate.bpm, confidence: heartRate.confidence },
      hrv: {
        sdnn: hrv?.sdnn ?? 0,
        confidence: hrv?.confidence ?? 0,
      },
      ppgData: samples.slice(-SAMPLES_TO_KEEP),
      timestamp: new Date().toISOString(),
    };
    try {
      const res = await fetch('/api/save-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const data = await res.json();
      if (data.success) setSaveStatus('Saved');
      else setSaveStatus('Error: ' + (data.error || 'Unknown'));
    } catch {
      setSaveStatus('Error: request failed');
    }
  }

  async function sendToApi() {
    const res = await fetch('/api/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        samples: samples.slice(-10),
        timestamp: Date.now(),
      }),
    });
    const data = await res.json();
    setApiResponse(data);
  }

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!isRecording || !video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    function tick() {
      if (!running || !ctx) return;
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v?.srcObject || !v.videoWidth || !c) {
        requestAnimationFrame(tick);
        return;
      }

      c.width = v.videoWidth;
      c.height = v.videoHeight;
      ctx.drawImage(v, 0, 0);

      const w = 10;
      const h = 10;
      const x = (c.width - w) / 2;
      const y = (c.height - h) / 2;
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      const data = ctx.getImageData(x, y, w, h).data;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let pixelCount = 0;

      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        pixelCount += 1;
      }

      const ppgValue = computePPGFromRGB(
        rSum,
        gSum,
        bSum,
        pixelCount,
        signalCombination,
      );

      setSamples((prev) => [...prev.slice(-(SAMPLES_TO_KEEP - 1)), ppgValue]);
      requestAnimationFrame(tick);
    }

    tick();
    return () => {
      running = false;
    };
  }, [isRecording, signalCombination]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4f8ff_0%,#eef8f4_45%,#f8fafc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
              BIOF3003 Assignment
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              PPG Heart Rate Monitor
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Live camera capture, signal comparison, model upload, and labeled
              data collection in a single dashboard.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Session
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {isRecording ? 'Recording live' : 'Ready to start'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1.45fr]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-[28px] bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
                <div>
                  <p className="text-sm font-semibold">Camera Capture</p>
                  <p className="text-xs text-slate-300">
                    Place your fingertip over the center marker
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isRecording
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/10 text-slate-200'
                  }`}
                >
                  {isRecording ? 'Live' : 'Idle'}
                </span>
              </div>
              <div className="flex min-h-[320px] items-center justify-center bg-[radial-gradient(circle_at_top,#1e293b_0%,#020617_70%)] p-4 sm:min-h-[420px]">
                <div className="flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="hidden"
                  />
                  {isRecording ? (
                    <canvas
                      ref={canvasRef}
                      className="h-full min-h-[280px] w-full object-contain"
                    />
                  ) : (
                    <span className="px-6 text-center text-sm text-slate-300">
                      Start recording to activate the camera preview.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Live Controls
                  </h2>
                  <p className="text-sm text-slate-600">
                    Switch signal mode and manage capture actions.
                  </p>
                </div>
                <button
                  onClick={() => setIsRecording((r) => !r)}
                  className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
                    isRecording
                      ? 'bg-rose-500 hover:bg-rose-600'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isRecording ? 'Stop recording' : 'Start recording'}
                </button>
              </div>

              <div className="mt-5">
                <SignalCombinationSelector
                  value={signalCombination}
                  onChange={setSignalCombination}
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={checkBackend}
                  className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white hover:bg-slate-900"
                >
                  Check backend
                </button>
                <button
                  onClick={saveRecord}
                  className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white hover:bg-cyan-700"
                >
                  Save record
                </button>
              </div>

              {(backendStatus || saveStatus || error) && (
                <div className="mt-4 space-y-2 text-sm">
                  {backendStatus && (
                    <p className="text-slate-700">Backend: {backendStatus}</p>
                  )}
                  {saveStatus && (
                    <p className="text-slate-700">Save record: {saveStatus}</p>
                  )}
                  {error && <p className="text-red-600">{error}</p>}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Signal Trace
                  </h2>
                  <p className="text-sm text-slate-600">
                    Real-time PPG waveform from the selected capture mode.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {samples.length} samples
                </div>
              </div>
              <ChartComponent
                ppgData={samples.slice(-SAMPLES_TO_KEEP)}
                valleys={valleys}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SimpleCard
                title="Heart rate"
                value={heartRate.bpm > 0 ? `${heartRate.bpm} bpm` : '--'}
              />
              <SimpleCard
                title="Confidence"
                value={
                  heartRate.confidence > 0
                    ? `${heartRate.confidence.toFixed(0)}%`
                    : '--'
                }
              />
              <SimpleCard
                title="HRV"
                value={hrv.sdnn > 0 ? `${hrv.sdnn} ms` : '--'}
              />
              <SimpleCard
                title="Current PPG"
                value={samples[samples.length - 1]?.toFixed(1) ?? '-'}
              />
              <SimpleCard
                title="Last 20"
                valueClassName="text-sm font-medium leading-6 sm:text-base"
                value={
                  samples
                    .slice(-20)
                    .map((s) => s.toFixed(0))
                    .join(', ') || '-'
                }
              />
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Signal Quality
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Quality updates continuously while recording once enough fresh
                samples have been collected.
              </p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
                {inferenceResult?.message && (
                  <p className="text-slate-600">{inferenceResult.message}</p>
                )}
                {inferenceResult?.label ? (
                  <p className="text-slate-900">
                    Predicted: <strong>{inferenceResult.label}</strong>
                    {inferenceResult.confidence > 0 &&
                      ` (${(inferenceResult.confidence * 100).toFixed(0)}% confidence)`}
                  </p>
                ) : (
                  <p className="text-slate-500">
                    {isRecording && samples.length < MIN_SAMPLES_FOR_DETECTION
                      ? 'Collecting samples...'
                      : !isRecording
                        ? 'Start recording for quality inference'
                        : '--'}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                ML Workflow
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Create labeled segments, export your dataset, and upload trained
                artifacts without leaving the dashboard.
              </p>

              <div className="mt-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Collect labeled data
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Choose the label that matches the current waveform before
                  saving the segment.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-5">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="segmentLabel"
                      checked={segmentLabel === 'good'}
                      onChange={() => setSegmentLabel('good')}
                    />
                    Good
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="segmentLabel"
                      checked={segmentLabel === 'bad'}
                      onChange={() => setSegmentLabel('bad')}
                    />
                    Bad
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={sendLabeledSegment}
                    className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white hover:bg-amber-600"
                  >
                    Send labeled segment
                  </button>
                  <button
                    onClick={downloadLabeledJson}
                    disabled={labeledSegments.length === 0}
                    className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    Download labeled_records.json
                  </button>
                </div>
                {segmentStatus && (
                  <p className="mt-3 text-sm text-slate-700">{segmentStatus}</p>
                )}
              </div>

              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Upload trained model
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    type="file"
                    ref={modelInputRef}
                    accept=".joblib"
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    type="file"
                    ref={scalerInputRef}
                    accept=".joblib"
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={handleUploadModel}
                  className="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Upload Model + Scaler
                </button>
                {uploadStatus && (
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    {uploadStatus}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
