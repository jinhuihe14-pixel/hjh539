import { useSceneStore } from '../store/sceneStore'

interface SimulationControlsProps {
  onScreenshot?: () => void
}

export function SimulationControls({ onScreenshot }: SimulationControlsProps) {
  const { isSimulationRunning, simulationSpeed, toggleSimulation, setSimulationSpeed } = useSceneStore()

  const speeds = [0.5, 1, 2, 4]

  return (
    <div className="simulation-controls">
      <button 
        className={`sim-btn ${isSimulationRunning ? 'active' : ''}`}
        onClick={toggleSimulation}
      >
        {isSimulationRunning ? '⏸ 暂停' : '▶ 播放'}
      </button>
      <div className="speed-control">
        <span className="speed-label">速度:</span>
        {speeds.map(speed => (
          <button
            key={speed}
            className={`sim-btn ${simulationSpeed === speed ? 'active' : ''}`}
            onClick={() => setSimulationSpeed(speed)}
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            {speed}x
          </button>
        ))}
      </div>
      {onScreenshot && (
        <button className="sim-btn" onClick={onScreenshot} style={{ marginLeft: '8px' }}>
          📷 截图
        </button>
      )}
    </div>
  )
}
