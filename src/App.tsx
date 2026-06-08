import { useState, useEffect } from 'react'
import { SceneCanvas } from './components/SceneCanvas'
import { ControlPanel } from './components/ControlPanel'
import { InfoPanel } from './components/InfoPanel'
import { HeaderBar } from './components/HeaderBar'
import { useDeviceStore } from './store/deviceStore'
import { useSceneStore } from './store/sceneStore'

function App() {
  const { initMockData, selectedDeviceId } = useDeviceStore()
  const { setViewMode } = useSceneStore()
  const [showInfoPanel, setShowInfoPanel] = useState(false)

  useEffect(() => {
    initMockData()
    setViewMode('orbit')
  }, [])

  useEffect(() => {
    if (selectedDeviceId) {
      setShowInfoPanel(true)
    }
  }, [selectedDeviceId])

  return (
    <div className="app-container">
      <HeaderBar />
      <div className="main-content">
        <ControlPanel />
        <SceneCanvas />
        {showInfoPanel && <InfoPanel onClose={() => setShowInfoPanel(false)} />}
      </div>
    </div>
  )
}

export default App
