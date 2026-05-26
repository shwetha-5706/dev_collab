type Props = {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  title?: string;
  noBorder?: boolean;
};

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 36,
  lg: 44,
  xl: 96,
};

const fontMap = {
  xs: '0.68rem',
  sm: '0.78rem',
  md: '0.85rem',
  lg: '1rem',
  xl: '2rem',
};

export function getInitial(name: string) {
  return (name?.trim()?.charAt(0) ?? '?').toUpperCase();
}

function colorFromName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 52%, 42%)`;
}

const UserAvatar = ({ name, size = 'md', className = '', title, noBorder }: Props) => {
  const px = sizeMap[size];
  const initial = getInitial(name);

  return (
    <span
      className={`avatar-pill avatar-initial ${size !== 'md' ? size : ''} ${noBorder ? 'avatar-no-border' : ''} ${className}`.trim()}
      style={{
        width: px,
        height: px,
        fontSize: fontMap[size],
        background: colorFromName(name || 'User'),
      }}
      title={title ?? name}
      aria-label={name}
      role="img"
    >
      {initial}
    </span>
  );
};

export default UserAvatar;
