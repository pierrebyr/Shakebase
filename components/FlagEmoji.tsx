const FLAG_MAP: Record<string, string> = {
  Portugal: '🇵🇹',
  USA: '🇺🇸',
  'United States': '🇺🇸',
  Japan: '🇯🇵',
  UK: '🇬🇧',
  'United Kingdom': '🇬🇧',
  Israel: '🇮🇱',
  Ghana: '🇬🇭',
  France: '🇫🇷',
  Mexico: '🇲🇽',
  Spain: '🇪🇸',
  Italy: '🇮🇹',
  Germany: '🇩🇪',
  Brazil: '🇧🇷',
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Canada: '🇨🇦',
}

export function FlagEmoji({ country }: { country: string | null | undefined }) {
  return <span style={{ fontSize: 12, lineHeight: 1 }}>{(country && FLAG_MAP[country]) || '🌐'}</span>
}
