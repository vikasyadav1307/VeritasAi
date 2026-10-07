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
        <circle cx="120" cy="120" r="105" fill="none" stroke="#26343D" strokeWidth="1" />
        <circle cx="120" cy="120" r="80" fill="none" stroke="#17232C" strokeWidth="1" />
        <circle cx="120" cy="120" r="50" fill="none" stroke="#26343D" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="120" cy="120" r="20" fill="none" stroke="#2CB7A5" strokeWidth="1" strokeOpacity="0.4" />

        {/* Crosshairs */}
        <line x1="120" y1="10" x2="120" y2="230" stroke="#26343D" strokeWidth="1" />
        <line x1="10" y1="120" x2="230" y2="120" stroke="#26343D" strokeWidth="1" />

        {/* Diagonal tick marks */}
        <line x1="45" y1="45" x2="55" y2="55" stroke="#6F7C84" strokeWidth="1" />
        <line x1="195" y1="45" x2="185" y2="55" stroke="#6F7C84" strokeWidth="1" />
        <line x1="45" y1="195" x2="55" y2="185" stroke="#6F7C84" strokeWidth="1" />
        <line x1="195" y1="195" x2="185" y2="185" stroke="#6F7C84" strokeWidth="1" />

        {/* Verified Data Coordinates */}
        <circle cx="145" cy="85" r="3" fill="#2CB7A5" />
        <circle cx="90" cy="150" r="2.5" fill="#35B98A" />
        <circle cx="160" cy="160" r="2.5" fill="#6F7C84" />

        {/* Coordinate vector connector */}
        <polyline points="90,150 120,120 145,85" fill="none" stroke="#2CB7A5" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="2 2" />

        {/* Telemetry Labels */}
        <text x="125" y="24" fill="#6F7C84" fontSize="8" fontFamily="var(--font-mono)">LAT 00°N</text>
        <text x="175" y="116" fill="#6F7C84" fontSize="8" fontFamily="var(--font-mono)">GRID A-4</text>
        <text x="125" y="222" fill="#6F7C84" fontSize="8" fontFamily="var(--font-mono)">100% OPERATIONAL</text>
      </svg>

      {/* Subtle Information Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '8px',
          padding: '4px 10px',
          background: '#111A22',
          border: '1px solid #26343D',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: '#9BA7AE',
          zIndex: 2,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#35B98A',
          }}
        />
        <span>TELEMETRY ONLINE</span>
      </div>
    </div>
  );
}
