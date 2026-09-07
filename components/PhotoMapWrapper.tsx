"use client";

import dynamic from "next/dynamic";

const PhotoMap = dynamic(() => import("./PhotoMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-8rem)] min-h-[560px] w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
      Loading photo map...
    </div>
  ),
});

export default PhotoMap;
