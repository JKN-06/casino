import React, { useState } from 'react';

interface FaceAvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'w-4 h-4 text-[8px]',
  sm: 'w-5 h-5 text-[9px]',
  md: 'w-7 h-7 text-xs',
  lg: 'w-9 h-9 text-sm',
  xl: 'w-12 h-12 text-base'
};

export const FaceAvatar: React.FC<FaceAvatarProps> = ({
  src,
  name = 'User',
  size = 'sm',
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'U';

  const sizeClass = SIZE_CLASSES[size];

  if (!src || imgError) {
    return (
      <div
        className={`rounded-full bg-gradient-to-br from-amber-600 to-rose-600 text-white font-bold flex items-center justify-center shrink-0 border border-white/10 shadow-sm ${sizeClass} ${className}`}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 rounded-full overflow-hidden border border-white/15 shadow-sm bg-[#1a2233] ${sizeClass} ${className}`}>
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
};
