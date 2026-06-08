import { useSceneStore } from '../store/sceneStore'

const VIEW_MODES = [
  { id: 'orbit', label: '环绕视角' },
  { id: 'firstPerson', label: '第一人称' },
  { id: 'fly', label: '飞行视角' },
  { id: 'inspection', label: '定点巡检' },
]

export function ViewControls() {
  const { viewMode, setViewMode } = useSceneStore()

  return (
    <div className="view-controls">
      {VIEW_MODES.map(mode => (
        <button
          key={mode.id}
          className={`view-btn ${viewMode === mode.id ? 'active' : ''}`}
          onClick={() => setViewMode(mode.id as any)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
