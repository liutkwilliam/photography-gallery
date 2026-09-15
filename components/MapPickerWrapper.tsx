"use client";

import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-80 w-full items-center justify-center rounded-md border border-zinc-300 bg-zinc-100 text-sm text-zinc-500">
      Loading map...
    </div>
  ),
});

export default MapPicker;
