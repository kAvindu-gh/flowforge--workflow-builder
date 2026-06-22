import { useState, useEffect, useCallback } from 'react'
import { getWorkflows, createWorkflow, deleteWorkflow } from '../services/api'

export default function Dashboard({ onOpenEditor }) {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')

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

  async function handleCreate() {
    if (!newName.trim()) return
    try {
      const res = await createWorkflow({ name: newName, nodes: [], edges: [] })
      setWorkflows(prev => [...prev, res.data])
      setNewName('')
      setCreating(false)
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

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#285ccc' }}>FlowForge</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Your workflow automations</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          style={{ background: '#285ccc', color: '#fff2bd', padding: '10px 20px' }}
        >
          + New Workflow
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div style={{ background: '#1e2130', border: '1px solid #2d3250', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>Workflow name</p>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Weather Alert Workflow"
            autoFocus
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={handleCreate} style={{ background: '#285ccc', color: '#fff2bd' }}>
              Create
            </button>
            <button onClick={() => setCreating(false)} style={{ background: '#2d3250', color: '#e2e8f0' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Workflow list */}
      {loading ? (
        <p style={{ color: '#64748b' }}>Loading...</p>
      ) : workflows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <p style={{ fontSize: '18px' }}>No workflows yet</p>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>Click "New Workflow" to get started</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {workflows.map(wf => (
            <div
              key={wf.id}
              style={{ background: '#1e2130', border: '1px solid #2d3250', borderRadius: '10px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <p style={{ fontWeight: '600', fontSize: '16px' }}>{wf.name}</p>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                  {wf.nodes.length} nodes · Created {new Date(wf.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onOpenEditor(wf.id)}
                  style={{ background: '#7c6af7', color: 'white' }}
                >
                  Open
                </button>
                <button
                  onClick={() => handleDelete(wf.id)}
                  style={{ background: '#2d3250', color: '#e2e8f0' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}