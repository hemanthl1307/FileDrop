const NAMESPACE = "filedrop-relay-v1-";

// 4-digit numeric room code, easy to read aloud and type on a phone.
export function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function toPeerId(code) {
  return NAMESPACE + String(code).trim().toUpperCase();
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
