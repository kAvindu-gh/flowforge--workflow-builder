const NODE_TYPES = [
  {
    type: 'http',
    label: 'HTTP Request',
    description: 'Call an external API',
    color: '#3b82f6',
    defaultData: { label: 'HTTP Request', url: '', method: 'GET' }
  },
  {
    type: 'delay',
    label: 'Delay',
    description: 'Wait for N seconds',
    color: '#f59e0b',
    defaultData: { label: 'Delay', seconds: 1 }
  },
  {
    type: 'filter',
    label: 'Filter',
    description: 'Check a condition',
    color: '#10b981',
    defaultData: { label: 'Filter', value: 0, operator: '>', threshold: 0 }
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Modify text data',
    color: '#8b5cf6',
    defaultData: { label: 'Transform', text: '', operation: 'uppercase' }
  }
]

export default function NodePanel({ onAddNode }) {
  return (
    <div style={{
      width: '220px',
      background: '#1e2130',
      borderRight: '1px solid #2d3250',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      overflowY: 'auto'
    }}>
      <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
        Drag to add nodes
      </p>

      {NODE_TYPES.map(node => (
        <div
          key={node.type}
          onClick={() => onAddNode(node)}
          style={{
            background: '#0f1117',
            border: `1px solid ${node.color}44`,
            borderLeft: `3px solid ${node.color}`,
            borderRadius: '8px',
            padding: '12px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1a1f2e'}
          onMouseLeave={e => e.currentTarget.style.background = '#0f1117'}
        >
          <p style={{ fontWeight: '600', fontSize: '14px', color: node.color }}>
            {node.label}
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {node.description}
          </p>
        </div>
      ))}
    </div>
  )
}