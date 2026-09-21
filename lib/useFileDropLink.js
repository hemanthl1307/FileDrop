"use client";
const ICE_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: process.env.NEXT_PUBLIC_TURN_URL,
    username: process.env.NEXT_PUBLIC_TURN_USERNAME,
    credential: process.env.NEXT_PUBLIC_TURN_PASSWORD,
  },
];
import { useCallback, useEffect, useRef, useState } from "react";
import { generateRoomCode, toPeerId } from "./utils";

const CHUNK_SIZE = 64 * 1024;
const BUFFER_HIGH_WATER = 8 * 1024 * 1024;

/**
 * Flow:
 *   Sender  : createRoom() -> stageFiles(files) -> room code is live.
 *             Any receiver who joins gets the staged files automatically.
 *             Multiple receivers can collect the same files, one after another.
 *   Receiver: joinRoom(code) -> receives the file list -> downloads.
 *
 * The sender's tab must stay open, because the files live on their device
 * and are never uploaded anywhere.
 */
export function useFileDropLink() {
  // ---- shared ----
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [role, setRole] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);

  // ---- sender ----
  const [stagedFiles, setStagedFiles] = useState([]);
  const [peerCount, setPeerCount] = useState(0);
  const [sendProgress, setSendProgress] = useState(null);
  const [deliveredCount, setDeliveredCount] = useState(0);

  // ---- receiver ----
  const [manifest, setManifest] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [recvProgress, setRecvProgress] = useState(null);

  const peerRef = useRef(null);
  const connsRef = useRef([]);
  const stagedRef = useRef([]);
  const expireTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const incomingRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    expireTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const teardown = useCallback(() => {
    clearTimers();
    connsRef.current.forEach((c) => {
      try {
        c.close();
      } catch (e) {}
    });
    connsRef.current = [];
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}
    }
    peerRef.current = null;
  }, [clearTimers]);

  useEffect(() => teardown, [teardown]);

  // Warn the sender before they close the tab while a room is live.
  useEffect(() => {
    if (role !== "sender" || !roomCode) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [role, roomCode]);

  const startExpiry = useCallback(
    (minutes) => {
      clearTimers();
      const total = Math.round(minutes * 60);
      setSecondsLeft(total);
      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => (s !== null && s > 0 ? s - 1 : s));
      }, 1000);
      expireTimerRef.current = setTimeout(() => {
        setStatus("expired");
        setStagedFiles([]);
        stagedRef.current = [];
        teardown();
      }, total * 1000);
    },
    [clearTimers, teardown]
  );

  // ---------------- sender ----------------

  const sendToConn = useCallback(async (conn) => {
    const files = stagedRef.current;
    if (!files.length || !conn.open) return;

    conn.send({
      type: "manifest",
      files: files.map((f, i) => ({
        id: i,
        name: f.name,
        size: f.size,
        mime: f.type,
      })),
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE) || 1;
      let sent = 0;

      conn.send({ type: "start", id: i });

      for (let index = 0; index < totalChunks; index++) {
        if (!conn.open) return;
        const slice = file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
        const buf = await slice.arrayBuffer();

        while (conn.open && conn.bufferSize > BUFFER_HIGH_WATER) {
          await new Promise((r) => setTimeout(r, 40));
        }

        conn.send({ type: "chunk", id: i, index, buf });
        sent += buf.byteLength;
        setSendProgress({
          name: file.name,
          pct: Math.min(100, Math.round((sent / (file.size || 1)) * 100)),
        });
      }

      conn.send({ type: "end", id: i });
    }

    conn.send({ type: "all-done" });
    setSendProgress(null);
    setDeliveredCount((c) => c + 1);
  }, []);

  const createRoom = useCallback(
    async (timerMinutes) => {
      setErrorMsg(null);
      setRole("sender");
      setStatus("opening");

      const { Peer } = await import("peerjs");

      // Retry a couple of times in case a 4-digit code is already taken.
      const attempt = (tries = 0) => {
        const code = generateRoomCode();
       const peer = new Peer(toPeerId(code), {
    debug: 0,
    config: {
    iceServers: ICE_SERVERS,
    },
  });
        peerRef.current = peer;

        peer.on("open", () => {
          setRoomCode(code);
          setStatus("live");
          if (timerMinutes) startExpiry(timerMinutes);
        });

        peer.on("connection", (conn) => {
          connsRef.current.push(conn);
          conn.on("open", () => {
            setPeerCount(connsRef.current.filter((c) => c.open).length);
            sendToConn(conn);
          });
          conn.on("close", () => {
            connsRef.current = connsRef.current.filter((c) => c !== conn);
            setPeerCount(connsRef.current.filter((c) => c.open).length);
          });
          conn.on("error", () => {});
        });

        peer.on("error", (err) => {
          const raw = String(err);
          if (raw.includes("unavailable-id") && tries < 4) {
            try {
              peer.destroy();
            } catch (e) {}
            attempt(tries + 1);
            return;
          }
          setErrorMsg(humanizeError(raw));
          setStatus("error");
        });
      };

      attempt();
    },
    [startExpiry, sendToConn]
  );

  const stageFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      const next = [...stagedRef.current, ...files];
      stagedRef.current = next;
      setStagedFiles(next);
      // Push to anyone already waiting in the room.
      connsRef.current.filter((c) => c.open).forEach((c) => sendToConn(c));
    },
    [sendToConn]
  );

  const removeStagedFile = useCallback((index) => {
    const next = stagedRef.current.filter((_, i) => i !== index);
    stagedRef.current = next;
    setStagedFiles(next);
  }, []);

  // ---------------- receiver ----------------

  const joinRoom = useCallback(async (code) => {
    setErrorMsg(null);
    setRole("receiver");
    setStatus("opening");

    const { Peer } = await import("peerjs");
    const peer = new Peer({
  debug: 0,
  config: {
    iceServers: ICE_SERVERS,
  },
});
    peerRef.current = peer;

    peer.on("open", () => {
      const conn = peer.connect(toPeerId(code), { reliable: true });
      connsRef.current = [conn];

      conn.on("open", () => {
        setRoomCode(String(code));
        setStatus("waiting-files");
      });

      conn.on("data", (msg) => {
        if (msg.type === "manifest") {
          setManifest(msg.files);
          setReceivedFiles([]);
          setStatus("receiving");
        } else if (msg.type === "start") {
          incomingRef.current = { id: msg.id, chunks: [], bytes: 0 };
        } else if (msg.type === "chunk") {
          const cur = incomingRef.current;
          if (!cur || cur.id !== msg.id) return;
          cur.chunks[msg.index] = msg.buf;
          cur.bytes += msg.buf.byteLength;
          setManifest((prev) => {
            const meta = prev.find((f) => f.id === msg.id);
            if (meta) {
              setRecvProgress({
                name: meta.name,
                pct: Math.min(
                  100,
                  Math.round((cur.bytes / (meta.size || 1)) * 100)
                ),
              });
            }
            return prev;
          });
        } else if (msg.type === "end") {
          const cur = incomingRef.current;
          if (!cur || cur.id !== msg.id) return;
          const blob = new Blob(cur.chunks);
          const url = URL.createObjectURL(blob);
          setReceivedFiles((prev) => [...prev, { id: msg.id, url }]);
          incomingRef.current = null;
        } else if (msg.type === "all-done") {
          setRecvProgress(null);
          setStatus("ready");
        }
      });

      conn.on("close", () =>
        setStatus((s) => (s === "ready" ? s : "closed"))
      );
     conn.on("error", (err) => {
  console.error("Connection error:", err);
  console.error("Error type:", err.type);
  console.error("Error message:", err.message);

  setErrorMsg(
    `Connection error: ${err.type || "unknown"}`
  );
  setStatus("error");
});
    });
peer.on("error", (err) => {
  console.error("PeerJS error:", err);
  console.error("Error type:", err.type);
  console.error("Error message:", err.message);

  setErrorMsg(humanizeError(String(err)));
  setStatus("error");
});
  }, []);

  const reset = useCallback(() => {
    teardown();
    stagedRef.current = [];
    incomingRef.current = null;
    setStatus("idle");
    setErrorMsg(null);
    setRoomCode(null);
    setRole(null);
    setSecondsLeft(null);
    setStagedFiles([]);
    setPeerCount(0);
    setSendProgress(null);
    setDeliveredCount(0);
    setManifest([]);
    setReceivedFiles([]);
    setRecvProgress(null);
  }, [teardown]);

  return {
    status,
    errorMsg,
    roomCode,
    role,
    secondsLeft,
    stagedFiles,
    peerCount,
    sendProgress,
    deliveredCount,
    manifest,
    receivedFiles,
    recvProgress,
    createRoom,
    stageFiles,
    removeStagedFile,
    joinRoom,
    reset,
  };
}

function humanizeError(raw) {
  if (raw.includes("peer-unavailable"))
    return "No room with that code. Check the digits, and make sure the sender still has their tab open.";
  if (raw.includes("network"))
    return "Connection lost. Check your internet and try again.";
  if (raw.includes("unavailable-id"))
    return "Couldn't get a free room code. Try again.";
  return "Something went wrong with the connection. Try again.";
}
