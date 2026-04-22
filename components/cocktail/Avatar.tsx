type Props = {
  name: string
  size?: number
  src?: string | null
}

export function Avatar({ name, size = 28, src }: Props) {
  const initials = name
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')

  const hue = (name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 60) + 20

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
        }}
      />
    )
  }

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        minWidth: size,
        aspectRatio: '1 / 1',
        flexShrink: 0,
        background: `linear-gradient(135deg, hsl(${hue} 40% 78%), hsl(${hue + 15} 45% 55%))`,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  )
}
