"use client";

import { useEffect, useRef } from "react";
import type { RemoteTrack } from "livekit-client";

type RemoteVideoProps = {
  track: RemoteTrack;
};

/** Attach a LiveKit video track to a &lt;video&gt; element; detach on unmount. */
export function RemoteVideo({ track }: RemoteVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  return (
    <video
      ref={ref}
      className="w-full max-h-64 rounded bg-black"
      playsInline
      muted
    />
  );
}
