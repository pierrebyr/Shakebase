import { Icon, GLASS_ICONS, type IconName } from '@/components/icons'

type Props = {
  glass?: string | null
  size?: number
  className?: string
}

export function GlassIcon({ glass, size = 14, className }: Props) {
  const name: IconName = (glass && GLASS_ICONS[glass]) || 'cup'
  return <Icon name={name} size={size} className={className} />
}
