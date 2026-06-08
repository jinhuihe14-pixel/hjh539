import { useState, useEffect } from 'react'
import { SceneCanvas } from './components/SceneCanvas'
import { ControlPanel } from './components/ControlPanel'
import { InfoPanel } from './components/InfoPanel'
import { HeaderBar } from './components/HeaderBar'
import { MaintenancePanel } from './components/MaintenancePanel'
import { RecordingPanel } from './components/RecordingPanel'
import { InspectionPanel } from './components/InspectionPanel'
import { AnnotationPanel } from './components/AnnotationPanel'
import { useDeviceStore } from './store/deviceStore'
import { useSceneStore } from './store/sceneStore'
import { useAnnotationStore } from './store/annotationStore'
import { useRecordingStore } from './store/recordingStore'
import { useInspectionStore } from './store/inspectionStore'
import { useMaintenanceStore } from './store/maintenanceStore'
import { useNetworkStore } from './store/networkStore'

type PanelType = 'maintenance' | 'recording' | 'inspection' | 'annotation' | null

function App() {
  const { initMockData, selectedDeviceId } = useDeviceStore()
  const { setViewMode } = useSceneStore()
  const { initMockData: initAnnotationData } = useAnnotationStore()
  const { initMockData: initRecordingData } = useRecordingStore()
  const { initMockData: initInspectionData } = useInspectionStore()
  const { initMockData: initMaintenanceData } = useMaintenanceStore()
  
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [activePanel, setActivePanel] = useState<PanelType>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    initMockData()
    initAnnotationData()
    initRecordingData()
    initInspectionData()
    initMaintenanceData()
    setViewMode('orbit')
  }, [])

  useEffect(() => {
    if (selectedDeviceId) {
      setShowInfoPanel(true)
    }
  }, [selectedDeviceId])

  const handleOpenPanel = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel)
    setShowInfoPanel(false)
  }

  const handleCanvasReady = (canvasEl: HTMLCanvasElement) => {
    setCanvas(canvasEl)
  }

  return (
    <div className="app-container">
      <HeaderBar />
      <div className="main-content">
        <ControlPanel
          onOpenMaintenance={() => handleOpenPanel('maintenance')}
          onOpenRecording={() => handleOpenPanel('recording')}
          onOpenInspection={() => handleOpenPanel('inspection')}
          onOpenAnnotation={() => handleOpenPanel('annotation')}
        />
        <SceneCanvas onCanvasReady={handleCanvasReady} />
        
        {showInfoPanel && (
          <InfoPanel 
            onClose={() => setShowInfoPanel(false)} 
            onOpenMaintenance={() => {
              setShowInfoPanel(false)
              setActivePanel('maintenance')
            }}
          />
        )}

        {activePanel === 'maintenance' && (
          <MaintenancePanel onClose={() => setActivePanel(null)} />
        )}

        {activePanel === 'recording' && (
          <RecordingPanel canvas={canvas} onClose={() => setActivePanel(null)} />
        )}

        {activePanel === 'inspection' && (
          <InspectionPanel onClose={() => setActivePanel(null)} />
        )}

        {activePanel === 'annotation' && (
          <AnnotationPanel onClose={() => setActivePanel(null)} />
        )}
      </div>
    </div>
  )
}

export default App
