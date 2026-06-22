import { useState, useCallback, useEffect } from 'react'
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

function generateNodeId() {
  return `node_${nodeIdCounter++}`
}

const PRIMARY = '#285ccc'
const ACCENT  = '#fff2bd'

function getNodeStyle(type) {
  const colors = {
    http:      '#285ccc',
    delay:     '#f59e0b',
    filter:    '#10b981',
    transform: '#8b5cf6'
  }
  const color = colors[type] || PRIMARY
  return {
    background:   '#1e2130',
    border:       `2px solid ${color}`,
    borderRadius: '8px',
    color:        '#e2e8f0',
    padding:      '10px 16px',
    minWidth:     '140px'
  }
}

export default function WorkflowEditorPage({ workflowId, onBack }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [workflowName, setWorkflowName]  = useState('')
  const [saving, setSaving]              = useState(false)
  const [running, setRunning]            = useState(false)
  const [saveMsg, setSaveMsg]            = useState('')
  const [history, setHistory]            = useState([])
  const [showHistory, setShowHistory]    = useState(false)
  const [selectedNode, setSelectedNode]  = useState(null)
  const [loadError, setLoadError]        = useState(null)

  useEffect(() => {
    if (!workflowId) return

    async function load() {
      try {
        setLoadError(null)
        const res = await getWorkflow(workflowId)
        const wf  = res.data

        setWorkflowName(wf.name || 'Untitled Workflow')

        const rfNodes = (wf.nodes || []).map(n => ({
          id:       n.id,
          type:     'default',
          position: n.position || { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 },
          data:     { label: n.data?.label || n.type || 'Node', ...n.data },
          style:    getNodeStyle(n.type)
        }))

        const rfEdges = (wf.edges || []).map(e => ({
          id:       e.id || `e_${e.source}_${e.target}`,
          source:   e.source,
          target:   e.target,
          animated: true,
          style:    { stroke: PRIMARY }
        }))

        setNodes(rfNodes)
        setEdges(rfEdges)
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
      style: { stroke: PRIMARY }
    }, eds))
  }, [setEdges])

  function handleAddNode(nodeTemplate) {
    const id = generateNodeId()
    const newNode = {
      id,
      type:     'default',
      position: { x: 250 + Math.random() * 150, y: 150 + Math.random() * 150 },
      data:     { label: nodeTemplate.defaultData.label, ...nodeTemplate.defaultData, nodeType: nodeTemplate.type },
      style:    getNodeStyle(nodeTemplate.type)
    }
    setNodes(nds => [...nds, newNode])
  }

  function handleNodeClick(event, node) {
    setShowHistory(false)
    setSelectedNode(node)
  }

  function handleNodeUpdate(nodeId, newData) {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n
      return {
        ...n,
        data:  newData,
        style: getNodeStyle(newData.nodeType),
      }
    }))
    setSelectedNode(prev => (prev ? { ...prev, data: newData } : null))
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      const storageNodes = nodes.map(n => ({
        id:       n.id,
        type:     n.data?.nodeType || 'unknown',
        position: n.position,
        data:     n.data
      }))

      const storageEdges = edges.map(e => ({
        id:     e.id,
        source: e.source,
        target: e.target
      }))

      await updateWorkflow(workflowId, { nodes: storageNodes, edges: storageEdges })
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch (err) {
      setSaveMsg('Save failed')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleRun() {
    await handleSave()
    setRunning(true)
    try {
      const res       = await runWorkflow(workflowId)
      const execution = res.data
      alert(`Execution ${execution.status.toUpperCase()}\n\nCheck history to see results.`)
      fetchHistory()
    } catch (err) {
      alert('Failed to run workflow')
      console.error(err)
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

  // Guard: no workflowId at all
  if (!workflowId) {
    return (
      <div style={{ padding: '32px' }}>
        <button onClick={onBack} style={{ background: '#2d3250', color: '#e2e8f0' }}>
          ← Back
        </button>
        <p style={{ color: '#64748b', marginTop: '16px' }}>No workflow selected.</p>
      </div>
    )
  }

  // Guard: load failed
  if (loadError) {
    return (
      <div style={{ padding: '32px' }}>
        <button onClick={onBack} style={{ background: '#2d3250', color: '#e2e8f0' }}>
          ← Back
        </button>
        <p style={{ color: '#ef4444', marginTop: '16px' }}>Error: {loadError}</p>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 20px', background: '#1e2130',
        borderBottom: '1px solid #2d3250'
      }}>
        <button onClick={onBack} style={{ background: '#2d3250', color: '#e2e8f0' }}>
          ← Back
        </button>

        <p style={{ fontWeight: '600', fontSize: '16px', flex: 1, color: ACCENT }}>
          {workflowName}
        </p>

        {saveMsg && (
          <span style={{ fontSize: '13px', color: '#10b981' }}>{saveMsg}</span>
        )}

        <button onClick={fetchHistory} style={{ background: '#2d3250', color: '#e2e8f0' }}>
          History
        </button>

        <button onClick={handleSave} disabled={saving} style={{ background: '#2d3250', color: '#e2e8f0' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleRun}
          disabled={running}
          style={{ background: PRIMARY, color: ACCENT, fontWeight: '600' }}
        >
          {running ? 'Running...' : '▶ Run'}
        </button>
      </div>

      {/* Hint bar */}
      <div style={{
        background: '#0f1117', borderBottom: '1px solid #2d3250',
        padding: '6px 20px', fontSize: '12px', color: '#64748b'
      }}>
        Click a node to configure it · Click a node or edge then press Delete to remove it
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        <NodePanel onAddNode={handleAddNode} />

        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            deleteKeyCode={['Delete', 'Backspace']}
            fitView
          >
            <Background color="#2d3250" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={PRIMARY}
              maskColor="#0f111788"
              style={{ background: '#1e2130' }}
            />
          </ReactFlow>
        </div>

        {selectedNode && !showHistory && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
            hasIncomingEdge={edges.some(e => e.target === selectedNode.id)}
          />
        )}

        {showHistory && (
          <div style={{
            width: '300px', background: '#1e2130',
            borderLeft: '1px solid #2d3250',
            padding: '16px', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ fontWeight: '600', color: ACCENT }}>Execution History</p>
              <button
                onClick={() => setShowHistory(false)}
                style={{ background: 'none', color: '#64748b', padding: '0' }}
              >✕</button>
            </div>

            {history.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>No executions yet</p>
            ) : (
              history.map(ex => {
                let parsedResult = null
                try {
                parsedResult = ex.result ? JSON.parse(ex.result) : null
                } catch {
                parsedResult = null
                }

                return (
                <div key={ex.id} style={{
                  background: '#0f1117', borderRadius: '8px',
                  padding: '12px', marginBottom: '8px',
                  border: `1px solid ${ex.status === 'success' ? '#10b98144' : '#ef444444'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: '600',
                      color: ex.status === 'success' ? '#10b981' : '#ef4444'
                    }}>
                      {ex.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>#{ex.id}</span>
                  </div>

                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {new Date(ex.started_at).toLocaleString()}
                  </p>

                  {ex.error && (
                    <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{ex.error}</p>
                  )}

                  {/* Show each node's output */}
                  {parsedResult?.steps && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {parsedResult.steps.map((step, i) => (
                        <div key={i} style={{
                          background: '#1e2130', borderRadius: '6px', padding: '8px',
                          borderLeft: `2px solid ${step.result.status === 'success' ? '#10b981' : '#ef4444'}`
                        }}>
                          <p style={{ fontSize: '11px', fontWeight: '600', color: '#fff2bd' }}>
                            {step.node_label} <span style={{ color: '#64748b', fontWeight: '400' }}>({step.node_type})</span>
                          </p>
                          <pre style={{
                            fontSize: '10px', color: '#94a3b8', marginTop: '4px',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                          }}>
                            {JSON.stringify(step.result.output, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )
                })
            )}
          </div>
        )}
      </div>
    </div>
  )
}