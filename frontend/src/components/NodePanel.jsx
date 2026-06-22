const NODE_TYPES = [
  {
    type: 'http',
    label: 'HTTP Request',
    description: 'Call an external API URL',
    icon: '🌐',
    color: 'var(--node-http)',
  },
  {
    type: 'delay',
    label: 'Delay',
    description: 'Pause for N seconds',
    icon: '⏱',
    color: 'var(--node-delay)',
  },
  {
    type: 'filter',
    label: 'Filter',
    description: 'Check a condition',
    icon: '🔀',
    color: 'var(--node-filter)',
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Modify text data',
    icon: '✨',
    color: 'var(--node-transform)',
  },
]

const DEFAULT_DATA = {
  http:      { label: 'HTTP Request', url: '', method: 'GET' },
  delay:     { label: 'Delay',        seconds: 1 },
  filter:    { label: 'Filter',       value: 0, operator: '>', threshold: 0 },
  transform: { label: 'Transform',    text: '', operation: 'uppercase' },
}

export { NODE_TYPES, DEFAULT_DATA }

export default function NodePanel({ onAddNode }) {
  return (
    <div style={{
      width:         '200px',
      flexShrink:    0,
      background:    'var(--bg-panel)',
      borderRight:   '1px solid var(--border-subtle)',
      display:       'flex',
      flexDirection: 'column',
      overflowY:     'auto',
    }}>

      {/* Header */}
      <div style={{
        padding:      '16px 16px 10px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <p style={{
          fontSize:      '10px',
          fontFamily:    'var(--font-mono)',
          fontWeight:    '700',
          color:         'var(--text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
        }}>
          Node Library
        </p>
      </div>

      {/* Node cards */}
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {NODE_TYPES.map(node => (
          <NodeCard
            key={node.type}
            node={node}
            onAdd={() => onAddNode({ type: node.type, defaultData: DEFAULT_DATA[node.type] })}
          />
        ))}
      </div>

      {/* Bottom tip */}
      <div style={{
        marginTop:  'auto',
        padding:    '12px 14px',
        borderTop:  '1px solid var(--border-subtle)',
      }}>
        <p style={{
          fontSize:   '11px',
          color:      'var(--text-faint)',
          lineHeight: '1.5',
        }}>
          Click a node to add it to the canvas, then connect them by dragging between handles.
        </p>
      </div>
    </div>
  )
}

function NodeCard({ node, onAdd }) {
  const [hovering, setHovering] = useState(false)

  return (
    <div
      onClick={onAdd}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background:   hovering ? `${node.color}18` : 'var(--bg-base)',
        border:       `1px solid ${hovering ? node.color : 'var(--border-subtle)'}`,
        borderLeft:   `3px solid ${node.color}`,
        borderRadius: 'var(--radius-sm)',
        padding:      '10px 12px',
        cursor:       'pointer',
        transition:   'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
        <span style={{ fontSize: '14px' }}>{node.icon}</span>
        <p style={{
          fontSize:   '13px',
          fontWeight: '600',
          color:      hovering ? node.color : 'var(--text-primary)',
          transition: 'color 0.15s ease',
        }}>
          {node.label}
        </p>
      </div>
      <p style={{
        fontSize:    '11px',
        color:       'var(--text-faint)',
        paddingLeft: '22px',
        lineHeight:  '1.4',
      }}>
        {node.description}
      </p>
    </div>
  )
}

import { useState } from 'react'