import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import WorkflowEditorPage from './pages/WorkflowEditorPage'
import './index.css'

export default function App() {
  // Simple routing without react-router — just swap pages with state
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null)

  function openEditor(workflowId) {
    setSelectedWorkflowId(workflowId)
    setCurrentPage('editor')
  }

  function goToDashboard() {
    setSelectedWorkflowId(null)
    setCurrentPage('dashboard')
  }

  return (
    <>
      {currentPage === 'dashboard' && (
        <Dashboard onOpenEditor={openEditor} />
      )}
      {currentPage === 'editor' && (
        <WorkflowEditorPage
          workflowId={selectedWorkflowId}
          onBack={goToDashboard}
        />
      )}
    </>
  )
}