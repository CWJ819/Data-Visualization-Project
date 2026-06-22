export default function RiverGuidesOverlay({ guides }) {
  if (!guides || guides.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
        }}
      >
        {guides.map(guide => (
          <line
            key={`${guide.name}-line`}
            x1={4 + guide.labelWidth}
            y1={`${guide.labelY}%`}
            x2={guide.guideEndX}
            y2={`${guide.targetY}%`}
            stroke={guide.color}
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.68"
          />
        ))}
      </svg>

      {guides.map(guide => (
        <div
          key={`${guide.name}-label`}
          style={{
            position: 'absolute',
            left: 4,
            top: `${guide.labelY}%`,
            transform: 'translateY(-50%)',
            color: guide.labelColor,
            fontSize: guide.fontSize,
            fontWeight: 500,
            lineHeight: `${guide.fontSize + 2}px`,
            whiteSpace: 'nowrap',
          }}
        >
          {guide.name}
        </div>
      ))}
    </div>
  )
}
