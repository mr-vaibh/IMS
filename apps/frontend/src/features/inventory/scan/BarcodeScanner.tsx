"use client";

import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

export default function BarcodeScanner({
  onScan,
  onError,
}: {
  onScan: (code: string) => void;
  onError?: (err: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let active = true;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
        if (!active) return;

        if (result) {
          alert(`Scanned: ${result.getText()}`);
          onScan(result.getText());
        }
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch(() => {
        onError?.("Camera access denied or unavailable");
      });

    return () => {
      active = false;

      // ✅ CORRECT cleanup
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [onScan, onError]);

  return (
    <div className="border rounded overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-64 object-cover"
        muted
        playsInline
      />
    </div>
  );
}
