import { useSceneStore } from '../store/sceneStore'
import { useDeviceStore } from '../store/deviceStore'

export function ControlPanel() {
  const { 
    showLabels, toggleLabels, 
    showPipes, togglePipes, 
    showCameras, toggleCameras,
  } = useSceneStore()
  
  const { getDevicesByStatus, selectDevice } = useDeviceStore()

  const faultDevices = getDevicesByStatus('fault')

  const handleDeviceClick = (deviceId: string) => {
    selectDevice(deviceId)
  }

  return (
    <aside className="control-panel">
      <div className="control-section">
        <div className="control-section-title">图层控制</div>
        <button 
          className={`control-btn ${showLabels ? 'active' : ''}`}
          onClick={toggleLabels}
        >
          🏷️ 设备标签
        </button>
        <button 
          className={`control-btn ${showPipes ? 'active' : ''}`}
          onClick={togglePipes}
        >
          🔧 管线系统
        </button>
        <button 
          className={`control-btn ${showCameras ? 'active' : ''}`}
          onClick={toggleCameras}
        >
          📷 安防设备
        </button>
      </div>

      <div className="control-section">
        <div className="control-section-title">故障预警</div>
        {faultDevices.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#7a8fa6' }}>暂无故障设备</p>
        ) : (
          faultDevices.map(device => (
            <button
              key={device.id}
              className="control-btn"
              onClick={() => handleDeviceClick(device.id)}
              style={{ borderColor: '#f44336' }}
            >
              <span style={{ color: '#f44336' }}>● </span>
              {device.name}
            </button>
          ))
        )}
      </div>

      <div className="control-section">
        <div className="control-section-title">状态图例</div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#4caf50' }}></div>
          <span>正常运行</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ffc107' }}></div>
          <span>待机</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#f44336' }}></div>
          <span>故障报警</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#9e9e9e' }}></div>
          <span>维修中</span>
        </div>
      </div>

      <div className="control-section">
        <div className="control-section-title">仓库状态</div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#4fc3f7' }}></div>
          <span>已占用</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#2a4a6a' }}></div>
          <span>空货位</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ffb74d' }}></div>
          <span>待拣选</span>
        </div>
      </div>

      <div className="control-section">
        <div className="control-section-title">管线类型</div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#4fc3f7' }}></div>
          <span>水管</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ffcc80' }}></div>
          <span>气管</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ffd54f' }}></div>
          <span>电缆</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ba68c8' }}></div>
          <span>信号线</span>
        </div>
      </div>
    </aside>
  )
}
