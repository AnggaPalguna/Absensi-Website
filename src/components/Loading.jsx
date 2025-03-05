'use client';

import { Loader2 } from 'lucide-react';

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
    </div>
  );
};

export default Loading;
