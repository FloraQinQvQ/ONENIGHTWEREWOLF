interface Props {
  avatarUrl: string | null;
  customAvatar: string | null;
  displayName: string;
  size?: number; // tailwind size unit, e.g. 8 = w-8 h-8
}

export default function PlayerAvatar({ avatarUrl, customAvatar, displayName, size = 8 }: Props) {
  const dim = `w-${size} h-${size}`;
  const base = `${dim} rounded-full flex-shrink-0`;

  if (customAvatar) {
    const fontSize = size <= 7 ? 'text-base' : size <= 9 ? 'text-xl' : 'text-2xl';
    return (
      <div className={`${base} bg-night-700 flex items-center justify-center ${fontSize}`}>
        {customAvatar}
      </div>
    );
  }
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className={`${base} object-cover`} />;
  }
  const textSize = size <= 7 ? 'text-xs' : 'text-sm';
  return (
    <div className={`${base} bg-night-700 flex items-center justify-center font-semibold ${textSize}`}>
      {displayName[0]?.toUpperCase()}
    </div>
  );
}
