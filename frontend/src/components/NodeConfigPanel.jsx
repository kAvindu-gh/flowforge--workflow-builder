export default function NodeConfigPanel({ node, onUpdate, onClose }) {
  if (!node) return null

  const data     = node.data || {}
  const nodeType = data.nodeType || 'unknown'

  function handleChange(field, value) {
    onUpdate(node.id, { ...data, [field]: value })
  }

  return (
    <div style={{
      width: '280px',
      background: '#1e2130',
      borderLeft: '1px solid #2d3250',
      padding: '20px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontWeight: '600', fontSize: '15px', color: '#fff2bd' }}>
          Configure Node
        </p>
        <button
          onClick={onClose}
          style={{ background: 'none', color: '#64748b', padding: '0', fontSize: '16px' }}
        >
          ✕
        </button>
      </div>

      {/* Node type badge */}
      <div style={{
        display: 'inline-block',
        background: '#285ccc22',
        border: '1px solid #285ccc',
        borderRadius: '6px',
        padding: '4px 10px',
        fontSize: '12px',
        color: '#285ccc',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {nodeType}
      </div>

      {/* Label — all node types have this */}
      <div>
        <label style={labelStyle}>Node Label</label>
        <input
          value={data.label || ''}
          onChange={e => handleChange('label', e.target.value)}
          placeholder="Display name on canvas"
        />
      </div>

      {/* HTTP node fields */}
      {nodeType === 'http' && (
        <>
          <div>
            <label style={labelStyle}>URL</label>
            <input
              value={data.url || ''}
              onChange={e => handleChange('url', e.target.value)}
              placeholder="https://api.example.com/data"
            />
          </div>
          <div>
            <label style={labelStyle}>Method</label>
            <select
              value={data.method || 'GET'}
              onChange={e => handleChange('method', e.target.value)}
              style={selectStyle}
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
          </div>
        </>
      )}

      {/* Delay node fields */}
      {nodeType === 'delay' && (
        <div>
          <label style={labelStyle}>Seconds to wait</label>
          <input
            type="number"
            min="1"
            max="30"
            value={data.seconds || 1}
            onChange={e => handleChange('seconds', parseInt(e.target.value))}
          />
        </div>
      )}

      {/* Filter node fields */}
      {nodeType === 'filter' && (
        <>
          <div>
            <label style={labelStyle}>Value to check</label>
            <input
              type="number"
              value={data.value || 0}
              onChange={e => handleChange('value', parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label style={labelStyle}>Operator</label>
            <select
              value={data.operator || '>'}
              onChange={e => handleChange('operator', e.target.value)}
              style={selectStyle}
            >
              <option value=">">&gt; Greater than</option>
              <option value="<">&lt; Less than</option>
              <option value="==">== Equal to</option>
              <option value=">=">&gt;= Greater or equal</option>
              <option value="<=">&lt;= Less or equal</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Threshold</label>
            <input
              type="number"
              value={data.threshold || 0}
              onChange={e => handleChange('threshold', parseFloat(e.target.value))}
            />
          </div>
        </>
      )}

      {/* Transform node fields */}
      {nodeType === 'transform' && (
        <>
          <div>
            <label style={labelStyle}>Text to transform</label>
            <input
              value={data.text || ''}
              onChange={e => handleChange('text', e.target.value)}
              placeholder="hello world"
            />
          </div>
          <div>
            <label style={labelStyle}>Operation</label>
            <select
              value={data.operation || 'uppercase'}
              onChange={e => handleChange('operation', e.target.value)}
              style={selectStyle}
            >
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
              <option value="titlecase">Title Case</option>
            </select>
          </div>
        </>
      )}

      {/* Tip */}
      <p style={{ fontSize: '12px', color: '#64748b', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #2d3250' }}>
        Changes apply instantly. Click Save to persist to database.
      </p>

    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  color: '#64748b',
  marginBottom: '6px',
  fontWeight: '500',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}

const selectStyle = {
  background: '#1e2130',
  border: '1px solid #2d3250',
  borderRadius: '6px',
  color: '#e2e8f0',
  padding: '8px 12px',
  fontSize: '14px',
  width: '100%',
  cursor: 'pointer'
}