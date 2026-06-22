import { useState, useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import NodePanel from '../components/NodePanel'
import NodeConfigPanel from '../components/NodeConfigPanel'
import { getWorkflow, updateWorkflow, runWorkflow, getHistory } from '../services/api'

let nodeIdCounter = 1
function generateNodeId() { return `node_${Date.now()}_${nodeIdCounter++}` }

const PRIMARY = '#285ccc'
const ACCENT  = '#fff2bd'

const NODE_COLORS = {
  http:      '#4d9fff',
  delay:     '#ffb454',
  filter:    '#3ddc97',
  transform: '#b794f6',
}

function getNodeStyle(type) {
  const color = NODE_COLORS[type] || PRIMARY
  return {
    background:   '#1c2333',
    border:       `1.5px solid ${color}`,
    borderRadius: '10px',
    color:        '#e8edf5',
    padding:      '10px 18px',
    minWidth:     '150px',
    fontSize:     '13px',
    fontWeight:   '600',
    boxShadow:    `0 0 0 0px ${color}44`,
    transition:   'box-shadow 0.2s ease',
  }
}

function Toast({ message, type }) {
  return (
    <div style={{
      position:     'fixed',
      bottom:       '28px',
      left:         '50%',
      transform:    'translateX(-50%)',
      background:   type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-error)' : 'var(--bg-elevated)',
      color:        type === 'success' ? '#0d1117' : type === 'error' ? '#0d1117' : 'var(--text-primary)',
      padding:      '10px 20px',
      borderRadius: 'var(--radius-md)',
      fontSize:     '13px',
      fontWeight:   '600',
      zIndex:       9999,
      boxShadow:    'var(--shadow-panel)',
      pointerEvents:'none',
    }}>
      {message}
    </div>
  )
}

export default function WorkflowEditorPage({ workflowId, onBack }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [workflowName, setWorkflowName]  = useState('')
  const [saving, setSaving]              = useState(false)
  const [running, setRunning]            = useState(false)
  const [toast, setToast]                = useState(null)
  const [history, setHistory]            = useState([])
  const [showHistory, setShowHistory]    = useState(false)
  const [selectedNode, setSelectedNode]  = useState(null)
  const [loadError, setLoadError]        = useState(null)
  const [nodeCount, setNodeCount]        = useState(0)
  const toastTimer                       = useRef(null)

  function showToast(message, type = 'info') {
    setToast({ message, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    if (!workflowId) return
    async function load() {
      try {
        setLoadError(null)
        const res = await getWorkflow(workflowId)
        const wf  = res.data
        setWorkflowName(wf.name || 'Untitled')

        const rfNodes = (wf.nodes || []).map(n => ({
          id:       n.id,
          type:     'default',
          position: n.position || { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 },
          data:     { label: n.data?.label || n.type || 'Node', ...n.data },
          style:    getNodeStyle(n.type),
        }))

        const rfEdges = (wf.edges || []).map(e => ({
          id:       e.id || `e_${e.source}_${e.target}`,
          source:   e.source,
          target:   e.target,
          animated: true,
          style:    { stroke: PRIMARY, strokeWidth: 2 },
        }))

        setNodes(rfNodes)
        setEdges(rfEdges)
        setNodeCount(rfNodes.length)
      } catch (err) {
        console.error('Failed to load workflow:', err)
        setLoadError(err.message || 'Failed to load workflow')
      }
    }
    load()
  }, [workflowId, setNodes, setEdges])

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({
      ...params,
      animated: true,
      style: { stroke: PRIMARY, strokeWidth: 2 },
    }, eds))
  }, [setEdges])

  function handleAddNode(nodeTemplate) {
    const id      = generateNodeId()
    const newNode = {
      id,
      type:     'default',
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data:     { label: nodeTemplate.defaultData.label, ...nodeTemplate.defaultData, nodeType: nodeTemplate.type },
      style:    getNodeStyle(nodeTemplate.type),
    }
    setNodes(nds => [...nds, newNode])
    setNodeCount(c => c + 1)
  }

  function handleNodeClick(_, node) {
    setShowHistory(false)
    setSelectedNode(node)
  }

  function handlePaneClick() {
    setSelectedNode(null)
  }

  function handleNodeUpdate(nodeId, newData) {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n
      return { ...n, data: newData, style: getNodeStyle(newData.nodeType) }
    }))
    setSelectedNode(prev => prev ? { ...prev, data: newData } : null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const storageNodes = nodes.map(n => ({
        id:       n.id,
        type:     n.data?.nodeType || 'unknown',
        position: n.position,
        data:     n.data,
      }))
      const storageEdges = edges.map(e => ({
        id: e.id, source: e.source, target: e.target,
      }))
      await updateWorkflow(workflowId, { nodes: storageNodes, edges: storageEdges })
      showToast('Workflow saved', 'success')
    } catch {
      showToast('Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRun() {
    await handleSave()
    setRunning(true)
    showToast('Running workflow...', 'info')
    try {
      const res       = await runWorkflow(workflowId)
      const execution = res.data
      if (execution.status === 'success') {
        showToast('Execution succeeded ✓', 'success')
      } else {
        showToast('Execution failed', 'error')
      }
      fetchHistory()
    } catch {
      showToast('Failed to run workflow', 'error')
    } finally {
      setRunning(false)
    }
  }

  async function fetchHistory() {
    try {
      const res = await getHistory(workflowId)
      setHistory(res.data || [])
      setShowHistory(true)
      setSelectedNode(null)
    } catch (err) {
      console.error('Failed to load history', err)
    }
  }

  if (!workflowId) {
    return (
      <div style={{ padding: '32px' }}>
        <button onClick={onBack} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>← Back</button>
        <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>No workflow selected.</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={{ padding: '32px' }}>
        <button onClick={onBack} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>← Back</button>
        <p style={{ color: 'var(--color-error)', marginTop: '16px' }}>Error: {loadError}</p>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>

      {/* Toolbar */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
        padding:      '0 16px',
        height:       '56px',
        background:   'var(--bg-panel)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink:   0,
      }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '6px 12px' }}
        >
          ← Back
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />

        {/* Workflow name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '16px' }}>⚡</span>
          <p style={{
            fontWeight:   '700',
            fontSize:     '15px',
            color:        'var(--color-accent)',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {workflowName}
          </p>
          <span style={{
            fontSize:      '10px',
            fontFamily:    'var(--font-mono)',
            color:         'var(--text-faint)',
            background:    'var(--bg-base)',
            border:        '1px solid var(--border-subtle)',
            borderRadius:  '4px',
            padding:       '2px 6px',
            flexShrink:    0,
          }}>
            {nodes.length} nodes
          </span>
        </div>

        {/* Right actions */}
        <button
          onClick={fetchHistory}
          style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '6px 14px' }}
        >
          History
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', padding: '6px 14px' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleRun}
          disabled={running}
          style={{
            background: running ? 'var(--color-primary)99' : PRIMARY,
            color:      ACCENT,
            padding:    '6px 20px',
            fontWeight: '700',
            fontSize:   '13px',
          }}
        >
          {running ? '⏳ Running...' : '▶ Run'}
        </button>
      </div>

      {/* Hint bar */}
      <div style={{
        padding:      '5px 16px',
        background:   'var(--bg-base)',
        borderBottom: '1px solid var(--border-subtle)',
        display:      'flex',
        alignItems:   'center',
        gap:          '16px',
        flexShrink:   0,
      }}>
        {[
          'Click a node type on the left to add it',
          'Drag between node handles to connect',
          'Click a node to configure it',
          'Select + Delete key to remove',
        ].map((tip, i) => (
          <span key={i} style={{
            fontSize:   '11px',
            color:      'var(--text-faint)',
            display:    'flex',
            alignItems: 'center',
            gap:        '5px',
          }}>
            <span style={{ color: PRIMARY, fontWeight: '700' }}>·</span>
            {tip}
          </span>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left — node library */}
        <NodePanel onAddNode={handleAddNode} />

        {/* Center — canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            deleteKeyCode={['Delete', 'Backspace']}
            fitView
          >
            <Background
              variant="dots"
              color="var(--border-strong)"
              gap={20}
              size={1.2}
            />
            <Controls
              style={{
                background:   'var(--bg-panel)',
                border:       '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
            <MiniMap
              nodeColor={n => NODE_COLORS[n.data?.nodeType] || PRIMARY}
              maskColor="rgba(13,17,23,0.75)"
              style={{
                background:   'var(--bg-panel)',
                border:       '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </ReactFlow>
        </div>

        {/* Right — config panel */}
        {selectedNode && !showHistory && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
            hasIncomingEdge={edges.some(e => e.target === selectedNode.id)}
          />
        )}

        {/* Right — history panel */}
        {showHistory && (
          <div style={{
            width:         '300px',
            flexShrink:    0,
            background:    'var(--bg-panel)',
            borderLeft:    '1px solid var(--border-subtle)',
            display:       'flex',
            flexDirection: 'column',
            overflowY:     'auto',
          }}>
            <div style={{
              padding:      '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'space-between',
            }}>
              <p style={{ fontWeight: '700', fontSize: '14px', color: ACCENT }}>
                Execution History
              </p>
              <button
                onClick={() => setShowHistory(false)}
                style={{ background: 'none', color: 'var(--text-faint)', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-faint)' }}>
                  <p style={{ fontSize: '24px', marginBottom: '8px' }}>📋</p>
                  <p style={{ fontSize: '13px' }}>No executions yet</p>
                </div>
              ) : (
                history.map(ex => {
                  let parsedResult = null
                  try { parsedResult = ex.result ? JSON.parse(ex.result) : null } catch {}

                  return (
                    <div key={ex.id} style={{
                      background:   'var(--bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      border:       `1px solid ${ex.status === 'success' ? 'var(--color-success)' : 'var(--color-error)'}33`,
                      overflow:     'hidden',
                    }}>
                      {/* Execution header */}
                      <div style={{
                        padding:    '10px 12px',
                        display:    'flex',
                        alignItems: 'center',
                        gap:        '8px',
                        borderBottom: parsedResult?.steps ? '1px solid var(--border-subtle)' : 'none',
                      }}>
                        <span style={{
                          fontSize:     '10px',
                          fontFamily:   'var(--font-mono)',
                          fontWeight:   '700',
                          color:        ex.status === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                          background:   ex.status === 'success' ? 'var(--color-success-dim)' : 'var(--color-error-dim)',
                          padding:      '2px 7px',
                          borderRadius: '4px',
                        }}>
                          {ex.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                          #{ex.id}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: 'auto' }}>
                          {new Date(ex.started_at).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Steps */}
                      {parsedResult?.steps && (
                        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {parsedResult.steps.map((step, i) => (
                            <div key={i} style={{
                              borderLeft: `2px solid ${step.result.status === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                              paddingLeft: '8px',
                            }}>
                              <p style={{
                                fontSize:   '11px',
                                fontWeight: '600',
                                color:      NODE_COLORS[step.node_type] || 'var(--text-primary)',
                                marginBottom:'2px',
                              }}>
                                {step.node_label}
                              </p>
                              <pre style={{
                                fontSize:   '10px',
                                fontFamily: 'var(--font-mono)',
                                color:      'var(--text-muted)',
                                whiteSpace: 'pre-wrap',
                                wordBreak:  'break-word',
                                lineHeight: '1.5',
                              }}>
                                {JSON.stringify(step.result.output, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}

                      {ex.error && (
                        <div style={{ padding: '8px 12px' }}>
                          <p style={{ fontSize: '11px', color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}>
                            {ex.error}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}