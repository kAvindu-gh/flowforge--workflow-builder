import { useState, useEffect, useCallback } from 'react'
import { getWorkflows, createWorkflow, deleteWorkflow } from '../services/api'

const NODE_TYPE_COLORS = {
  http:      'var(--node-http)',
  delay:     'var(--node-delay)',
  filter:    'var(--node-filter)',
  transform: 'var(--node-transform)',
}

function WorkflowCard({ workflow, onOpen, onDelete }) {
  const [hovering, setHovering] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const nodeTypes = [...new Set((workflow.nodes || []).map(n => n.type).filter(Boolean))]
  const createdDate = new Date(workflow.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  function handleDelete(e) {
    e.stopPropagation()
    if (confirming) {
      onDelete(workflow.id)
    } else {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 2500)
    }
  }

  return (
    <div
      onClick={() => onOpen(workflow.id)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setConfirming(false) }}
      style={{
        background:    hovering ? 'var(--bg-elevated)' : 'var(--bg-panel)',
        border:        `1px solid ${hovering ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
        borderRadius:  'var(--radius-md)',
        padding:       '20px 24px',
        cursor:        'pointer',
        transition:    'all 0.18s ease',
        display:       'flex',
        alignItems:    'center',
        gap:           '16px',
        boxShadow:     hovering ? '0 0 0 1px var(--color-primary)20, var(--shadow-panel)' : 'none',
      }}
    >
      {/* Icon */}
      <div style={{
        width:          '44px',
        height:         '44px',
        borderRadius:   'var(--radius-sm)',
        background:     'var(--color-primary-dim)',
        border:         '1px solid var(--color-primary)44',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '20px',
        flexShrink:     0,
      }}>
        ⚡
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight:   '600',
          fontSize:     '15px',
          color:        'var(--text-primary)',
          marginBottom: '6px',
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
        }}>
          {workflow.name}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {workflow.nodes.length} {workflow.nodes.length === 1 ? 'node' : 'nodes'}
          </span>

          <span style={{ color: 'var(--border-strong)', fontSize: '10px' }}>•</span>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {createdDate}
          </span>

          {/* Node type pills */}
          {nodeTypes.length > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {nodeTypes.map(type => (
                <span key={type} style={{
                  fontSize:     '10px',
                  fontFamily:   'var(--font-mono)',
                  fontWeight:   '600',
                  color:        NODE_TYPE_COLORS[type] || 'var(--text-muted)',
                  background:   `${NODE_TYPE_COLORS[type] || 'var(--text-muted)'}18`,
                  border:       `1px solid ${NODE_TYPE_COLORS[type] || 'var(--text-muted)'}44`,
                  borderRadius: '4px',
                  padding:      '1px 6px',
                  textTransform:'uppercase',
                  letterSpacing:'0.4px',
                }}>
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{ display: 'flex', gap: '8px', flexShrink: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => onOpen(workflow.id)}
          style={{
            background: 'var(--color-primary)',
            color:      'var(--color-accent)',
            padding:    '8px 16px',
          }}
        >
          Open →
        </button>

        <button
          onClick={handleDelete}
          style={{
            background: confirming ? 'var(--color-error-dim)' : 'var(--bg-base)',
            color:      confirming ? 'var(--color-error)' : 'var(--text-muted)',
            border:     `1px solid ${confirming ? 'var(--color-error)' : 'var(--border-subtle)'}`,
            padding:    '8px 12px',
            minWidth:   '60px',
          }}
        >
          {confirming ? 'Sure?' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

function CreateModal({ onCreate, onClose }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    await onCreate(name.trim())
    setLoading(false)
  }

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     'rgba(0,0,0,0.6)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      zIndex:         1000,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background:   'var(--bg-panel)',
        border:       '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        padding:      '32px',
        width:        '100%',
        maxWidth:     '420px',
        boxShadow:    'var(--shadow-panel)',
      }}>
        <p style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
          New Workflow
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Give your automation a clear name so you can find it later.
        </p>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. Weather Temperature Alert"
          autoFocus
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            style={{
              flex:       1,
              background: 'var(--color-primary)',
              color:      'var(--color-accent)',
              padding:    '10px',
            }}
          >
            {loading ? 'Creating...' : 'Create Workflow'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-base)',
              color:      'var(--text-muted)',
              border:     '1px solid var(--border-subtle)',
              padding:    '10px 16px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ onOpenEditor }) {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch]       = useState('')

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await getWorkflows()
      setWorkflows(res.data)
    } catch (err) {
      console.error('Failed to load workflows', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  async function handleCreate(name) {
    try {
      const res = await createWorkflow({ name, nodes: [], edges: [] })
      setWorkflows(prev => [res.data, ...prev])
      setShowModal(false)
    } catch (err) {
      console.error('Failed to create workflow', err)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteWorkflow(id)
      setWorkflows(prev => prev.filter(wf => wf.id !== id))
    } catch (err) {
      console.error('Failed to delete workflow', err)
    }
  }

  const filtered = workflows.filter(wf =>
    wf.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Top navbar */}
      <div style={{
        borderBottom: '1px solid var(--border-subtle)',
        background:   'var(--bg-panel)',
        padding:      '0 40px',
        display:      'flex',
        alignItems:   'center',
        height:       '60px',
        gap:          '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
          <span style={{
            fontWeight:    '800',
            fontSize:      '17px',
            color:         'var(--color-accent)',
            letterSpacing: '-0.3px',
          }}>
            FlowForge
          </span>
          <span style={{
            fontSize:     '10px',
            fontFamily:   'var(--font-mono)',
            color:        'var(--color-primary)',
            background:   'var(--color-primary-dim)',
            border:       '1px solid var(--color-primary)44',
            borderRadius: '4px',
            padding:      '2px 6px',
            fontWeight:   '600',
          }}>
            BETA
          </span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'var(--color-primary)',
            color:      'var(--color-accent)',
            padding:    '8px 18px',
          }}
        >
          + New Workflow
        </button>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{
            fontSize:      '28px',
            fontWeight:    '800',
            letterSpacing: '-0.5px',
            marginBottom:  '6px',
          }}>
            Your Workflows
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {workflows.length === 0
              ? 'No workflows yet — create one to get started'
              : `${workflows.length} workflow${workflows.length !== 1 ? 's' : ''} · click any to open the editor`}
          </p>
        </div>

        {/* Search bar — only show if there are workflows */}
        {workflows.length > 0 && (
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <span style={{
              position:  'absolute',
              left:      '12px',
              top:       '50%',
              transform: 'translateY(-50%)',
              color:     'var(--text-faint)',
              fontSize:  '14px',
              pointerEvents: 'none',
            }}>
              🔍
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search workflows..."
              style={{ paddingLeft: '36px' }}
            />
          </div>
        )}

        {/* States */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                height:       '80px',
                borderRadius: 'var(--radius-md)',
                background:   'var(--bg-panel)',
                border:       '1px solid var(--border-subtle)',
                animation:    'pulse 1.5s ease-in-out infinite',
                opacity:      1 - i * 0.15,
              }} />
            ))}
          </div>
        ) : filtered.length === 0 && search ? (
          <div style={{
            textAlign:    'center',
            padding:      '80px 24px',
            color:        'var(--text-faint)',
          }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>
              No workflows match "{search}"
            </p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>
              Try a different name
            </p>
          </div>
        ) : workflows.length === 0 ? (
          <div style={{
            textAlign:    'center',
            padding:      '100px 24px',
            border:       '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>⚡</p>
            <p style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              No workflows yet
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              Build your first automation — connect nodes,<br />configure them, and run.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: 'var(--color-primary)',
                color:      'var(--color-accent)',
                padding:    '12px 28px',
                fontSize:   '14px',
              }}
            >
              Create your first workflow
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(wf => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                onOpen={onOpenEditor}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <CreateModal
          onCreate={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}