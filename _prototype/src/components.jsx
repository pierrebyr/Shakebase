// Reusable presentational components

const DrinkOrb = ({ from, to, size = 40, ring = false, style = {} }) => (
  <div
    className="drink-orb"
    style={{
      width: size, height: size,
      ['--orb-from']: from, ['--orb-to']: to,
      boxShadow: ring ? `0 6px 18px ${to}40, inset 0 1px 1px rgba(255,255,255,0.3)` : `0 3px 10px ${to}30`,
      flexShrink: 0,
      ...style,
    }}
  />
);

// Photo placeholder — labeled stripes (per system prompt guidance)
const PhotoPlaceholder = ({ label = 'Photo', tone = 'warm', height = 220, gradient = null, style = {} }) => {
  const stripeFrom = gradient ? gradient[0] : '#efece4';
  const stripeTo = gradient ? gradient[1] : '#d8d2c4';
  return (
    <div style={{
      position: 'relative',
      height,
      borderRadius: 16,
      overflow: 'hidden',
      background: `repeating-linear-gradient(135deg, ${stripeFrom} 0 20px, ${stripeTo} 20px 40px)`,
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(80% 60% at 50% 50%, rgba(255,255,255,0.55), transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', left: 12, bottom: 10,
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        background: 'rgba(255,255,255,0.7)', padding: '3px 8px', borderRadius: 999,
      }}>
        IMG · {label}
      </div>
    </div>
  );
};

// Sparkline — accepts array of numbers
const Sparkline = ({ data, color = 'var(--accent)', height = 36, fill = true }) => {
  const w = 200, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [i / (data.length - 1) * w, h - 4 - ((v - min) / range) * (h - 8)]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height, overflow: 'visible' }} preserveAspectRatio="none">
      {fill && <path d={area} fill={color} fillOpacity="0.10" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
};

// Bar chart row
const BarRow = ({ label, sub, value, max, accent }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 60px', alignItems: 'center', gap: 14, padding: '10px 0' }}>
    <div className="col">
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{sub}</span>}
    </div>
    <div className="bar-track"><div className={`bar-fill${accent ? ' accent' : ''}`} style={{ width: `${(value / max) * 100}%` }} /></div>
    <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)', textAlign: 'right' }}>{value.toLocaleString()}</div>
  </div>
);

const Avatar = ({ name, size = 28 }) => {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');
  // Stable hue per name
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 60 + 20;
  return (
    <div className="avatar" style={{
      width: size, height: size,
      background: `linear-gradient(135deg, hsl(${hue} 40% 78%), hsl(${hue + 15} 45% 55%))`,
      fontSize: size * 0.36,
    }}>{initials}</div>
  );
};

const SectionHead = ({ kicker, title, action }) => (
  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16, alignItems: 'flex-end' }}>
    <div className="col">
      {kicker && <div className="page-kicker" style={{ marginBottom: 4 }}>{kicker}</div>}
      <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.01em' }}>{title}</h2>
    </div>
    {action}
  </div>
);

const StatCard = ({ kicker, value, delta, sub, accent = false, sparkData }) => (
  <div className="card card-pad fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 138 }}>
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <div className="panel-title">{kicker}</div>
      {delta && <span className={`stat-delta ${delta > 0 ? 'up' : 'down'}`}>{delta > 0 ? '↑' : '↓'} {Math.abs(delta)}%</span>}
    </div>
    <div className="stat-big" style={accent ? { color: 'var(--accent-ink)' } : {}}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{sub}</div>}
    {sparkData && <div style={{ marginTop: 'auto' }}><Sparkline data={sparkData} color={accent ? 'var(--accent)' : 'var(--ink-1)'} height={28} /></div>}
  </div>
);

Object.assign(window, { DrinkOrb, PhotoPlaceholder, Sparkline, BarRow, Avatar, SectionHead, StatCard });

// Glass icon lookup
const GLASS_ICONS = {
  'Coupe': 'glass-coupe',
  'Nick & Nora': 'glass-nicknora',
  'Rocks': 'glass-rocks',
  'Highball': 'glass-highball',
  'Collins': 'glass-collins',
  'Flute': 'glass-flute',
  'Snifter': 'glass-snifter',
  'Tiki mug': 'glass-tiki',
  'Wine glass': 'glass-wine',
};
const GlassIcon = ({ glass, size = 14, ...rest }) => {
  const name = GLASS_ICONS[glass] || 'cup';
  return <Icon name={name} size={size} {...rest} />;
};
window.GlassIcon = GlassIcon;
window.GLASS_ICONS = GLASS_ICONS;
