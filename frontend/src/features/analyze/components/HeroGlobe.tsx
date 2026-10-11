export function HeroGlobe() {
  return (
    <div
      style={{
        position: 'relative',
        width: 'min(260px, 100%)',
        maxWidth: '100%',
        aspectRatio: '1 / 1',
        height: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 1,
        minWidth: 0,
        boxSizing: 'border-box',
      }}
      aria-hidden="true"
    >
      {/* Precision Telemetry Radar Schematic */}
      <svg
        viewBox="0 0 240 240"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Outer reticle circle */}
        <circle cx="120" cy="120" r="105" fill="none" stroke="var(--border-color)" strokeWidth="1" />
        <circle cx="120" cy="120" r="80" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeOpacity="0.7" />
        <circle cx="120" cy="120" r="50" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="120" cy="120" r="20" fill="none" stroke="var(--color-accent)" strokeWidth="1" strokeOpacity="0.5" />

        {/* Crosshairs */}
        <line x1="120" y1="10" x2="120" y2="230" stroke="var(--border-color)" strokeWidth="1" />
        <line x1="10" y1="120" x2="230" y2="120" stroke="var(--border-color)" strokeWidth="1" />

        {/* Diagonal tick marks */}
        <line x1="45" y1="45" x2="55" y2="55" stroke="var(--text-muted)" strokeWidth="1" strokeOpacity="0.8" />
        <line x1="195" y1="45" x2="185" y2="55" stroke="var(--text-muted)" strokeWidth="1" strokeOpacity="0.8" />
        <line x1="45" y1="195" x2="55" y2="185" stroke="var(--text-muted)" strokeWidth="1" strokeOpacity="0.8" />
        <line x1="195" y1="195" x2="185" y2="185" stroke="var(--text-muted)" strokeWidth="1" strokeOpacity="0.8" />

        {/* Verified Data Coordinates */}
        <circle cx="145" cy="85" r="3" fill="var(--color-accent)" />
        <circle cx="90" cy="150" r="2.5" fill="var(--color-real)" />
        <circle cx="160" cy="160" r="2.5" fill="var(--text-muted)" />

        {/* Coordinate vector connector */}
        <polyline points="90,150 120,120 145,85" fill="none" stroke="var(--color-accent)" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="2 2" />

        {/* Telemetry Labels */}
        <text x="125" y="24" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">LAT 00°N</text>
        <text x="175" y="116" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">GRID A-4</text>
        <text x="125" y="222" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">100% OPERATIONAL</text>
      </svg>

      {/* Subtle Information Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '8px',
          padding: '4px 10px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          boxShadow: 'var(--shadow-card)',
          zIndex: 2,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-real)',
          }}
        />
        <span>TELEMETRY ONLINE</span>
      </div>
    </div>
  );
}
