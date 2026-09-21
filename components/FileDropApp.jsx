"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import RoomQR from "./RoomQR";
import { useFileDropLink } from "@/lib/useFileDropLink";
import { formatBytes, formatTime } from "@/lib/utils";

const TIMER_OPTIONS = [
  { label: "No timer", minutes: null },
  { label: "5 min", minutes: 5 },
  { label: "15 min", minutes: 15 },
  { label: "1 hour", minutes: 60 },
];

export default function FileDropApp() {
  const params = useSearchParams();
  const roomFromLink = params.get("room");

  const [mode, setMode] = useState(roomFromLink ? "receive" : "send");
  const [isDark, setIsDark] = useState(false);
  const [codeInput, setCodeInput] = useState(roomFromLink ?? "");
  const autoJoinedRef = useRef(false);
  const link = useFileDropLink();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const handler = (e) => setIsDark(e.detail.isDark);
    window.addEventListener("filedrop-theme-change", handler);
    return () => window.removeEventListener("filedrop-theme-change", handler);
  }, []);

  useEffect(() => {
    if (roomFromLink && !autoJoinedRef.current) {
      autoJoinedRef.current = true;
      link.joinRoom(roomFromLink);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomFromLink]);

  const shareUrl = useMemo(() => {
    if (!link.roomCode || typeof window === "undefined") return "";
    return `${window.location.origin}${window.location.pathname}?room=${link.roomCode}`;
  }, [link.roomCode]);

  const switchMode = (next) => {
    if (link.status !== "idle") link.reset();
    setMode(next);
    setCodeInput("");
  };

  const badge = statusBadge(link);

  return (
    <main className="min-h-screen bg-paper text-ink dark:bg-void dark:text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-16 pt-8 sm:max-w-lg">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              className="text-ink dark:text-signal"
            >
              <path d="M12 2L4 13h6l-2 9 10-13h-6l2-7z" fill="currentColor" />
            </svg>
            <span className="text-xl font-medium tracking-tight">FileDrop</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-mono dark:border-wire"
              role="status"
            >
              <span className={`h-2 w-2 rounded-full ${badge.color}`} />
              {badge.text}
            </div>
            <ThemeToggle />
          </div>
        </header>

        <section className="mt-14">
  <h1 className="hero-title text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
    Move files.
    <br />
    Your way.
  </h1>

  <p className="hero-description mt-6 max-w-md text-base leading-relaxed text-ink/55 dark:text-white/50">
  Fast, direct file sharing. No accounts. No servers.
  <br />
  Pick your files, get a 4-digit code, and share it.
</p>
</section>

        <div className="mt-6 flex rounded-full border border-ink/15 p-1 dark:border-wire">
          {["send", "receive"].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`focus-ring flex-1 rounded-full py-2 text-sm font-medium capitalize transition-colors ${
                mode === m
                  ? "bg-ink text-paper dark:bg-signal dark:text-white"
                  : "text-ink/50 hover:text-ink dark:text-white/50 dark:hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-8 flex-1">
          {mode === "send" ? (
            <SendPanel link={link} shareUrl={shareUrl} isDark={isDark} />
          ) : (
            <ReceivePanel
              link={link}
              codeInput={codeInput}
              setCodeInput={setCodeInput}
            />
          )}
        </div>

        {link.errorMsg && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {link.errorMsg}
          </div>
        )}

        <footer className="hero-footer mt-10 text-center text-xs text-ink/35 dark:text-white/30">
  Peer-to-peer. No accounts. Files never pass through a server.
  <br />
  <span className="mt-1 inline-block">
    © 2026 Hemanth L.
  </span>
</footer>
      </div>
    </main>
  );
}

function statusBadge(link) {
  const map = {
    idle: ["Standby", "bg-ink/30 dark:bg-white/30"],
    opening: ["Opening…", "bg-amber-500 animate-pulse"],
    live: ["Room live", "bg-emerald-500"],
    "waiting-files": ["Connected", "bg-emerald-500"],
    receiving: ["Receiving…", "bg-signal animate-pulse"],
    ready: ["Ready", "bg-emerald-500"],
    expired: ["Expired", "bg-red-500"],
    error: ["Error", "bg-red-500"],
    closed: ["Closed", "bg-ink/30 dark:bg-white/30"],
  };
  const [text, color] = map[link.status] || map.idle;
  return { text, color };
}

/* ------------------------------ SEND ------------------------------ */

function SendPanel({ link, shareUrl, isDark }) {
  const [timerMinutes, setTimerMinutes] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      link.stageFiles(e.dataTransfer.files);
    },
    [link]
  );

  if (link.status === "idle" || link.status === "opening") {
    return (
      <div>
        <h2 className="text-base font-medium">Create a room</h2>
        <p className="mt-1 text-sm text-ink/55 dark:text-white/50">
          You&apos;ll get a 4-digit code to share. Add your files right after.
        </p>

        <p className="mb-2 mt-5 text-xs uppercase tracking-wide text-ink/40 dark:text-white/35">
          Auto-delete after
        </p>
        <div className="grid grid-cols-4 gap-2">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setTimerMinutes(opt.minutes)}
              className={`focus-ring rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                timerMinutes === opt.minutes
                  ? "border-ink bg-ink text-paper dark:border-signal dark:bg-signal dark:text-white"
                  : "border-ink/15 text-ink/60 hover:border-ink/40 dark:border-wire dark:text-white/55 dark:hover:border-signal/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => link.createRoom(timerMinutes)}
          disabled={link.status === "opening"}
          className="focus-ring mt-5 w-full rounded-xl bg-ink py-3.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-signal dark:text-white"
        >
          {link.status === "opening" ? "Getting your code…" : "Generate room code"}
        </button>
      </div>
    );
  }

  if (link.status === "expired") {
    return (
      <EmptyState
        title="Room expired"
        body="The timer ran out and the code no longer works. Files were never stored anywhere."
        action={
          <button
            onClick={link.reset}
            className="focus-ring w-full rounded-xl bg-ink py-3 text-sm font-medium text-paper dark:bg-signal dark:text-white"
          >
            Start a new room
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Code + QR */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-ink/10 p-5 dark:border-wire dark:bg-panel/60">
        <p className="text-xs uppercase tracking-wide text-ink/40 dark:text-white/35">
          Your room code
        </p>
        <div className="flex gap-2 font-mono text-3xl font-semibold">
          {String(link.roomCode)
            .split("")
            .map((c, i) => (
              <span
                key={i}
                className="flex h-14 w-11 items-center justify-center rounded-lg border border-ink/15 dark:border-wire"
              >
                {c}
              </span>
            ))}
        </div>
        <RoomQR value={shareUrl} dark={isDark} />
        <div className="flex w-full gap-2">
          <CopyButton label="Copy link" value={shareUrl} />
          <CopyButton label="Copy code" value={String(link.roomCode)} />
        </div>
        {link.secondsLeft !== null && (
          <p className="text-xs text-ink/45 dark:text-white/40">
            Code expires in {formatTime(link.secondsLeft)}
          </p>
        )}
      </div>

      {/* Files */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-base font-medium">Your files</h2>
          {link.stagedFiles.length > 0 && (
            <span className="font-mono text-xs text-ink/45 dark:text-white/40">
              {link.stagedFiles.length} file
              {link.stagedFiles.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {link.stagedFiles.length > 0 && (
          <ul className="mb-3 space-y-2">
            {link.stagedFiles.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 px-4 py-3 dark:border-wire"
              >
                <span className="truncate text-sm font-medium">{f.name}</span>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-xs text-ink/45 dark:text-white/40">
                    {formatBytes(f.size)}
                  </span>
                  <button
                    onClick={() => link.removeStagedFile(i)}
                    aria-label={`Remove ${f.name}`}
                    className="focus-ring text-ink/35 hover:text-red-500 dark:text-white/30"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragActive
              ? "border-ink bg-ink/5 dark:border-signal dark:bg-signal/10"
              : "border-ink/20 dark:border-wire"
          }`}
        >
          <p className="text-sm text-ink/55 dark:text-white/50">
            {link.stagedFiles.length ? "Add more files, or" : "Drop files here, or"}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="focus-ring rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:opacity-90 dark:bg-signal dark:text-white"
          >
            Browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => link.stageFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Live activity */}
      <div className="rounded-2xl border border-ink/10 px-4 py-4 dark:border-wire">
        {link.sendProgress ? (
          <>
            <div className="mb-1.5 flex justify-between font-mono text-xs text-ink/50 dark:text-white/45">
              <span className="truncate">Sending {link.sendProgress.name}</span>
              <span>{link.sendProgress.pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-wire">
              <div
                className="h-full rounded-full bg-ink transition-[width] duration-150 dark:bg-signal"
                style={{ width: `${link.sendProgress.pct}%` }}
              />
            </div>
          </>
        ) : link.stagedFiles.length === 0 ? (
          <p className="text-sm text-ink/50 dark:text-white/45">
            Add files above. Anyone who enters your code will get them straight
            away.
          </p>
        ) : (
          <p className="text-sm text-ink/50 dark:text-white/45">
            Ready to go. {link.deliveredCount > 0
              ? `Collected ${link.deliveredCount} time${
                  link.deliveredCount > 1 ? "s" : ""
                } so far.`
              : "Waiting for someone to enter the code."}
          </p>
        )}
        {link.peerCount > 0 && (
          <p className="mt-2 font-mono text-xs text-emerald-600 dark:text-emerald-400">
            {link.peerCount} device{link.peerCount > 1 ? "s" : ""} connected
          </p>
        )}
      </div>

      <div className="rounded-xl bg-ink/5 px-4 py-3 text-xs leading-relaxed text-ink/55 dark:bg-panel dark:text-white/50">
        Keep this tab open until everyone has collected the files. They&apos;re
        sent from this device directly, so closing the tab ends the room.
      </div>

      <button
        onClick={link.reset}
        className="focus-ring w-full rounded-xl border border-ink/15 py-2.5 text-sm font-medium hover:border-ink/40 dark:border-wire dark:hover:border-signal/50"
      >
        Close room
      </button>
    </div>
  );
}

/* ---------------------------- RECEIVE ---------------------------- */

function ReceivePanel({ link, codeInput, setCodeInput }) {
  if (["waiting-files", "receiving", "ready"].includes(link.status)) {
    return <ReceiveList link={link} />;
  }

  if (link.status === "closed") {
    return (
      <EmptyState
        title="Room closed"
        body="The sender closed their tab or the room expired."
        action={
          <button
            onClick={link.reset}
            className="focus-ring w-full rounded-xl bg-ink py-3 text-sm font-medium text-paper dark:bg-signal dark:text-white"
          >
            Try another code
          </button>
        }
      />
    );
  }

  return (
    <div>
      <h2 className="text-base font-medium">Enter the room code</h2>
      <p className="mt-1 text-sm text-ink/55 dark:text-white/50">
        Type the 4 digits the sender gave you, or scan their QR code.
      </p>

      <input
        value={codeInput}
        onChange={(e) =>
          setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 4))
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" && codeInput.length === 4)
            link.joinRoom(codeInput);
        }}
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="0000"
        maxLength={4}
        aria-label="Room code"
        className="focus-ring mt-5 w-full rounded-xl border border-ink/15 bg-transparent px-4 py-4 text-center font-mono text-3xl tracking-[0.4em] placeholder:text-ink/20 dark:border-wire dark:placeholder:text-white/20"
      />

      <button
        onClick={() => link.joinRoom(codeInput)}
        disabled={codeInput.length !== 4 || link.status === "opening"}
        className="focus-ring mt-4 w-full rounded-xl bg-ink py-3.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-signal dark:text-white"
      >
        {link.status === "opening" ? "Connecting…" : "Find files"}
      </button>
    </div>
  );
}

function ReceiveList({ link }) {
  const urlFor = (id) => link.receivedFiles.find((r) => r.id === id)?.url;

  if (link.status === "waiting-files") {
    return (
      <EmptyState
        title="Connected"
        body="The sender hasn't added any files yet. They'll appear here automatically."
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-medium">
          {link.status === "ready" ? "Files ready" : "Incoming files"}
        </h2>
        <span className="font-mono text-xs text-ink/45 dark:text-white/40">
          room {link.roomCode}
        </span>
      </div>

      <ul className="space-y-2">
        {link.manifest.map((f) => {
          const url = urlFor(f.id);
          return (
            <li
              key={f.id}
              className="rounded-xl border border-ink/10 px-4 py-3 dark:border-wire"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium">{f.name}</span>
                <span className="shrink-0 font-mono text-xs text-ink/45 dark:text-white/40">
                  {formatBytes(f.size)}
                </span>
              </div>
              {url ? (
                <a
                  href={url}
                  download={f.name}
                  className="focus-ring mt-3 flex w-full items-center justify-center rounded-lg bg-ink py-2.5 text-sm font-medium text-paper hover:opacity-90 dark:bg-signal dark:text-white"
                >
                  Download
                </a>
              ) : (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-wire">
                  <div
                    className="h-full rounded-full bg-ink transition-[width] duration-150 dark:bg-signal"
                    style={{
                      width: `${
                        link.recvProgress?.name === f.name
                          ? link.recvProgress.pct
                          : 0
                      }%`,
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        onClick={link.reset}
        className="focus-ring mt-5 w-full rounded-xl border border-ink/15 py-2.5 text-sm font-medium hover:border-ink/40 dark:border-wire dark:hover:border-signal/50"
      >
        Done
      </button>
    </div>
  );
}

/* ---------------------------- shared ---------------------------- */

function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-2xl border border-ink/10 px-5 py-10 text-center dark:border-wire">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-ink/55 dark:text-white/50">
        {body}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function CopyButton({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch (e) {}
      }}
      className="focus-ring flex-1 rounded-lg border border-ink/15 py-2 text-xs font-medium hover:border-ink/40 dark:border-wire dark:hover:border-signal/50"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
