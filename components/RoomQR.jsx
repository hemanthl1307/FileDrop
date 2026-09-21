"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function RoomQR({ value, dark }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: 320,
      margin: 1,
      color: dark
        ? { dark: "#EAF1FF", light: "#00000000" }
        : { dark: "#0E0E10", light: "#00000000" },
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, dark]);

  if (!src) {
    return (
      <div className="aspect-square w-full max-w-[220px] animate-pulse rounded-2xl border border-ink/10 bg-ink/5 dark:border-wire dark:bg-wire/40" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="QR code that opens this room and joins automatically"
      className="w-full max-w-[220px] rounded-2xl border border-ink/10 p-3 dark:border-wire"
    />
  );
}
