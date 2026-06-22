export default function NodeConfigPanel({ node, onUpdate, onClose, hasIncomingEdge }) {
  if (!node) return null

  const data     = node.data || {}
  const nodeType = data.nodeType || 'unknown'

  const NODE_COLORS = {
    http:      'var(--node-http)',
    delay:     'var(--node-delay)',
    filter:    'var(--node-filter)',
    transform: 'var(--node-transform)',
  }

  const NODE_ICONS = {
    http: '🌐', delay: '⏱', filter: '🔀', transform: '✨'
  }

  const accentColor = NODE_COLORS[nodeType] || 'var(--color-primary)'

  function handleChange(field, value) {
    onUpdate(node.id, { ...data, [field]: value })
  }

  return (
    <div style={{
      width:         '272px',
      flexShrink:    0,
      background:    'var(--bg-panel)',
      borderLeft:    '1px solid var(--border-subtle)',
      display:       'flex',
      flexDirection: 'column',
      overflowY:     'auto',
    }}>

      {/* Header */}
      <div style={{
        padding:      '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
      }}>
        <div style={{
          width:          '32px',
          height:         '32px',
          borderRadius:   'var(--radius-sm)',
          background:     `${accentColor}22`,
          border:         `1px solid ${accentColor}44`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '16px',
          flexShrink:     0,
        }}>
          {NODE_ICONS[nodeType] || '⚙️'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize:      '10px',
            fontFamily:    'var(--font-mono)',
            fontWeight:    '700',
            color:         accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}>
            {nodeType}
          </p>
          <p style={{
            fontSize:    '13px',
            fontWeight:  '600',
            color:       'var(--text-primary)',
            whiteSpace:  'nowrap',
            overflow:    'hidden',
            textOverflow:'ellipsis',
          }}>
            {data.label || 'Untitled Node'}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            color:      'var(--text-faint)',
            padding:    '4px',
            fontSize:   '16px',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Fields */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Label field — all types */}
        <Field label="Display Label">
          <input
            value={data.label || ''}
            onChange={e => handleChange('label', e.target.value)}
            placeholder="Node name on canvas"
          />
        </Field>

        <Divider />

        {/* HTTP fields */}
        {nodeType === 'http' && (
          <>
            <Field label="Request URL">
              <input
                value={data.url || ''}
                onChange={e => handleChange('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              />
            </Field>
            <Field label="HTTP Method">
              <select
                value={data.method || 'GET'}
                onChange={e => handleChange('method', e.target.value)}
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
            </Field>
          </>
        )}

        {/* Delay fields */}
        {nodeType === 'delay' && (
          <Field label="Wait duration (seconds)">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                min="1"
                max="30"
                value={data.seconds || 1}
                onChange={e => handleChange('seconds', parseInt(e.target.value))}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', flexShrink: 0 }}>
                sec
              </span>
            </div>
          </Field>
        )}

        {/* Filter fields */}
        {nodeType === 'filter' && (
          <>
            {hasIncomingEdge && (
              <ToggleRow
                label="Auto-read from previous node"
                hint="Uses the numeric output of the connected node as the value"
                checked={!!data.useUpstream}
                onChange={v => handleChange('useUpstream', v)}
                accentColor={accentColor}
              />
            )}

            {!data.useUpstream && (
              <Field label="Value to compare">
                <input
                  type="number"
                  value={data.value ?? 0}
                  onChange={e => handleChange('value', parseFloat(e.target.value))}
                />
              </Field>
            )}

            {data.useUpstream && (
              <UpstreamBadge />
            )}

            <Field label="Operator">
              <select
                value={data.operator || '>'}
                onChange={e => handleChange('operator', e.target.value)}
              >
                <option value=">">{'>'} Greater than</option>
                <option value="<">{'<'} Less than</option>
                <option value="==">{'=='} Equal to</option>
                <option value=">=">{'>='} Greater or equal</option>
                <option value="<=">{'<='} Less or equal</option>
              </select>
            </Field>

            <Field label="Threshold">
              <input
                type="number"
                value={data.threshold ?? 0}
                onChange={e => handleChange('threshold', parseFloat(e.target.value))}
              />
            </Field>
          </>
        )}

        {/* Transform fields */}
        {nodeType === 'transform' && (
          <>
            {hasIncomingEdge && (
              <ToggleRow
                label="Auto-read from previous node"
                hint="Uses the text output of the connected node as the input"
                checked={!!data.useUpstream}
                onChange={v => handleChange('useUpstream', v)}
                accentColor={accentColor}
              />
            )}

            {!data.useUpstream && (
              <Field label="Input text">
                <input
                  value={data.text || ''}
                  onChange={e => handleChange('text', e.target.value)}
                  placeholder="hello world"
                />
              </Field>
            )}

            {data.useUpstream && (
              <UpstreamBadge />
            )}

            <Field label="Operation">
              <select
                value={data.operation || 'uppercase'}
                onChange={e => handleChange('operation', e.target.value)}
              >
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
                <option value="titlecase">Title Case</option>
              </select>
            </Field>
          </>
        )}

        {nodeType === 'unknown' && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            No configurable fields for this node type.
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop:  'auto',
        padding:    '12px 16px',
        borderTop:  '1px solid var(--border-subtle)',
      }}>
        <p style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: '1.5' }}>
          Changes are instant. Hit <strong style={{ color: 'var(--text-muted)' }}>Save</strong> in the toolbar to persist to the database.
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize:      '10px',
        fontFamily:    'var(--font-mono)',
        fontWeight:    '700',
        color:         'var(--text-faint)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div style={{
      height:     '1px',
      background: 'var(--border-subtle)',
      margin:     '0 -16px',
    }} />
  )
}

function ToggleRow({ label, hint, checked, onChange, accentColor }) {
  return (
    <div style={{
      background:   checked ? `${accentColor}12` : 'var(--bg-base)',
      border:       `1px solid ${checked ? accentColor + '44' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-sm)',
      padding:      '10px 12px',
      transition:   'all 0.15s ease',
    }}>
      <label style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '10px',
        cursor:     'pointer',
      }}>
        <div
          onClick={() => onChange(!checked)}
          style={{
            width:          '36px',
            height:         '20px',
            borderRadius:   '10px',
            background:     checked ? accentColor : 'var(--border-strong)',
            position:       'relative',
            flexShrink:     0,
            transition:     'background 0.2s ease',
            cursor:         'pointer',
          }}
        >
          <div style={{
            position:   'absolute',
            top:        '2px',
            left:       checked ? '18px' : '2px',
            width:      '16px',
            height:     '16px',
            borderRadius:'50%',
            background: 'white',
            transition: 'left 0.2s ease',
          }} />
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {label}
          </p>
          {hint && (
            <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
              {hint}
            </p>
          )}
        </div>
      </label>
    </div>
  )
}

function UpstreamBadge() {
  return (
    <div style={{
      background:   'var(--color-primary-dim)',
      border:       '1px solid var(--color-primary)44',
      borderRadius: 'var(--radius-sm)',
      padding:      '8px 12px',
      display:      'flex',
      alignItems:   'center',
      gap:          '8px',
    }}>
      <span style={{ fontSize: '14px' }}>🔗</span>
      <p style={{ fontSize: '12px', color: 'var(--color-primary)', lineHeight: '1.4' }}>
        Will read automatically from the connected node at runtime.
      </p>
    </div>
  )
}