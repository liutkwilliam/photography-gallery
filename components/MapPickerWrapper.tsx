'use client';

import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-md bg-zinc-100 border flex items-center justify-center text-zinc-400 text-sm">
      Loading Interactive Map...
    </div>
  ),
});

export default MapPicker;