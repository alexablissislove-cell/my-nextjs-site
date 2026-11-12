"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Worker } from "tesseract.js";
import { initializeOcrWorker } from "./ocr-worker";

const supportedTypes = ["image/png", "image/jpeg", "image/webp", "image/bmp"];
const maxBytes = 12 * 1024 * 1024;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ready when you are");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const workerRef = useRef<Worker | null>(null);
  const active = useRef(true);
  const running = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      void workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function selectFile(next: File) {
    if (running.current) return;
    setError("");
    setNotice("");
    if (!supportedTypes.includes(next.type)) {
      setError(
        "Choose a PNG, JPG, WebP, or BMP image. PDF files are not supported yet.",
      );
      return;
    }
    if (!next.size || next.size > maxBytes) {
      setError("Choose a non-empty image smaller than 12 MB.");
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setText("");
    setConfidence(null);
    setProgress(0);
    setStatus("Image ready to extract");
  }

  async function loadSample() {
    try {
      const response = await fetch("/sample-note.png");
      if (!response.ok) throw new Error("Sample unavailable");
      const blob = await response.blob();
      selectFile(new File([blob], "sample-note.png", { type: "image/png" }));
    } catch {
      setError("Could not load the sample. Please choose an image instead.");
    }
  }

  async function extract() {
    if (!file || running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setText("");
    setConfidence(null);
    setProgress(0);
    setStatus("Loading OCR engine…");
    let worker: Worker | undefined;
    try {
      worker = await initializeOcrWorker({
        workerPath: `${window.location.origin}/ocr/worker.min.js`,
        corePath: `${window.location.origin}/ocr`,
        langPath: `${window.location.origin}/ocr`,
        workerBlobURL: false,
        logger: (message) => {
          if (!active.current) return;
          if (message.status === "recognizing text") {
            setStatus("Reading your image…");
            setProgress(Math.round(message.progress * 100));
          }
        },
      });
      workerRef.current = worker;
      if (!active.current) return;
      const result = await worker.recognize(file);
      if (!active.current) return;
      setText(result.data.text.trim());
      setConfidence(Math.round(result.data.confidence));
      setProgress(100);
      setStatus(
        result.data.text.trim() ? "Extraction complete" : "No text found",
      );
      if (!result.data.text.trim()) {
        setNotice(
          "No readable text found. Try a sharper image with clear English text.",
        );
      }
    } catch {
      if (active.current) {
        setStatus("Extraction failed");
        setError(
          "Could not read this image. Try a clear, smaller image or reload and try again.",
        );
      }
    } finally {
      if (workerRef.current === worker) workerRef.current = null;
      await worker?.terminate().catch(() => {});
      running.current = false;
      if (active.current) setBusy(false);
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Text copied to clipboard.");
    } catch {
      setNotice("Clipboard unavailable. Select the text and copy it manually.");
    }
  }

  function downloadText() {
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file?.name.replace(/\.[^.]+$/, "") || "extracted"}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Text file downloaded.");
  }

  return (
    <div className="studio">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Text Studio home">
          <span className="brand-icon" aria-hidden="true">
            T
          </span>
          Text Studio<span className="brand-tag">OCR</span>
        </Link>
        <span className="local-badge">
          <span />
          Runs on your device
        </span>
      </header>
      <main className="workspace">
        <section className="intro">
          <p className="eyebrow">LESS RETYPING. MORE DOING.</p>
          <h1>
            Your images.
            <br />
            <span>Now in words.</span>
          </h1>
          <p className="intro-copy">
            Turn screenshots, scans, and photos into editable text.
            <br className="desktop-break" /> One workspace. No uploads to an OCR
            server.
          </p>
        </section>
        <div className="workbench">
          <section
            className="panel input-panel"
            aria-labelledby="source-heading"
          >
            <div className="panel-heading">
              <h2 id="source-heading">
                <span className="step">01</span>Source image
              </h2>
              <span className="small-label">ENGLISH</span>
            </div>
            <label
              className={`dropzone ${dragging ? "dragging" : ""} ${preview ? "has-preview" : ""} ${busy ? "is-busy" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const next = event.dataTransfer.files[0];
                if (next) selectFile(next);
              }}
            >
              <input
                aria-label="Choose source image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/bmp"
                disabled={busy}
                onChange={(event) => {
                  const next = event.target.files?.[0];
                  if (next) selectFile(next);
                  event.target.value = "";
                }}
              />
              {preview ? (
                <>
                  {/* Local blob previews cannot use Next's image optimization service. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={`Selected source: ${file?.name}`} />
                  <span className="replace-image">
                    {busy ? "Processing image…" : "Click or drop to replace"}
                  </span>
                </>
              ) : (
                <div className="upload-prompt">
                  <span className="upload-icon" aria-hidden="true">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
                    </svg>
                  </span>
                  <strong>Drop an image here</strong>
                  <span>
                    or <span className="browse">browse files</span>
                  </span>
                  <small>PNG, JPG, WebP, BMP · Up to 12 MB</small>
                </div>
              )}
            </label>
            <div className="file-row">
              <span title={file?.name}>
                {file ? file.name : "Nothing handy? Try our sample."}
              </span>
              <button
                className="text-button"
                onClick={loadSample}
                disabled={busy}
              >
                Use sample
              </button>
            </div>
            <button
              className="extract-button"
              onClick={extract}
              disabled={!file || busy}
            >
              {busy ? "Extracting text…" : "Extract text"}
              <span aria-hidden="true">→</span>
            </button>
            <div className="progress-area" role="status" aria-live="polite">
              <span>{status}</span>
              <span>
                {busy || progress === 100
                  ? `${progress}%`
                  : "Tesseract powered"}
              </span>
            </div>
            {busy && (
              <progress
                aria-label="Text recognition progress"
                max={100}
                value={progress}
              />
            )}
          </section>
          <section
            className="panel output-panel"
            aria-labelledby="output-heading"
          >
            <div className="panel-heading">
              <h2 id="output-heading">
                <span className="step">02</span>Extracted text
              </h2>
              <span className="small-label">EDITABLE</span>
            </div>
            <div className="result-area">
              <textarea
                aria-label="Extracted text"
                placeholder="Your words will appear here.

Extract text from an image, then edit, copy, or download it right here."
                value={text}
                onChange={(event) => setText(event.target.value)}
                disabled={busy}
                spellCheck={false}
              />
              {!text && !busy && (
                <span className="empty-mark" aria-hidden="true">
                  Aa
                </span>
              )}
            </div>
            <div className="result-meta">
              <span>{text.length.toLocaleString()} characters</span>
              <span>
                {confidence !== null
                  ? `${confidence}% OCR confidence`
                  : "Review results for accuracy"}
              </span>
            </div>
            <div className="output-actions">
              <button onClick={copyText} disabled={!text || busy}>
                Copy text
              </button>
              <button onClick={downloadText} disabled={!text || busy}>
                Download .txt <span aria-hidden="true">↓</span>
              </button>
            </div>
          </section>
        </div>
        {error && (
          <p className="message error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="message" role="status">
            {notice}
          </p>
        )}
        <footer className="workspace-footer">
          <p>
            <span aria-hidden="true">◈</span> Your images stay in your browser.
            No account or API key needed.
          </p>
          <p>Built for clear, printed English text.</p>
        </footer>
      </main>
    </div>
  );
}
