import { useSceneStore } from '../store/sceneStore'
import { useDeviceStore } from '../store/deviceStore'
import { useMaintenanceStore } from '../store/maintenanceStore'
import { useAnnotationStore } from '../store/annotationStore'
import { useNetworkStore } from '../store/networkStore'

interface ControlPanelProps {
  onOpenMaintenance: () => void
  onOpenRecording: () => void
  onOpenInspection: () => void
  onOpenAnnotation: () => void
}

export function ControlPanel({
  onOpenMaintenance,
  onOpenRecording,
  onOpenInspection,
  onOpenAnnotation,
}: ControlPanelProps) {
  const { 
    showLabels, toggleLabels, 
    showPipes, togglePipes, 
    showCameras, toggleCameras,
    showAnnotations, toggleAnnotations,
  } = useSceneStore()
  
  const { getDevicesByStatus, selectDevice } = useDeviceStore()
  const { getOrdersByStatus } = useMaintenanceStore()
  const { getUnresolvedCount, annotations } = useAnnotationStore()
  const { isOnline, isReconnecting } = useNetworkStore()

  const faultDevices = getDevicesByStatus('fault')
  const pendingOrders = getOrdersByStatus('pending')
  const inProgressOrders = getOrdersByStatus('inProgress')

  const handleDeviceClick = (deviceId: string) => {
    selectDevice(deviceId)
  }

  const unresolvedCount = getUnresolvedCount()

  return (
    <aside className="control-panel">
      <div className="control-section">
        <div className="control-section-title">功能模块</div>
        <button className="control-btn" onClick={onOpenMaintenance}>
          🔧 维保工单
          {pendingOrders.length > 0 && (
            <span className="badge">{pendingOrders.length}</span>
          )}
        </button>
        <button className="control-btn" onClick={onOpenRecording}>
          🎬 录播回放
        </button>
        <button className="control-btn" onClick={onOpenInspection}>
          🔍 巡检管理
        </button>
        <button 
          className={`control-btn`}
          onClick={onOpenAnnotation}
        >
          📌 模型标注
          {unresolvedCount > 0 && (
            <span className="badge warning">{unresolvedCount}</span>
          )}
        </button>
      </div>

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
        <button 
          className="control-btn"
          onClick={toggleAnnotations}
        >
          📍 标注显示
        </button>
      </div>

      <div className="control-section">
        <div className="control-section-title">
          维保工单
          {inProgressOrders.length > 0 && (
            <span className="status-dot in-progress"></span>
          )}
        </div>
        {pendingOrders.length === 0 && inProgressOrders.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#7a8fa6' }}>暂无维保工单</p>
        ) : (
          <>
            {pendingOrders.slice(0, 3).map(order => (
              <button
                key={order.id}
                className="control-btn small"
                onClick={onOpenMaintenance}
                style={{ borderColor: '#ff9800' }}
              >
                <span style={{ color: '#ff9800', fontSize: '11px' }}>待维保 </span>
                {order.deviceName}
              </button>
            ))}
            {inProgressOrders.slice(0, 2).map(order => (
              <button
                key={order.id}
                className="control-btn small"
                onClick={onOpenMaintenance}
                style={{ borderColor: '#2196f3' }}
              >
                <span style={{ color: '#2196f3', fontSize: '11px' }}>维保中 </span>
                {order.deviceName}
              </button>
            ))}
          </>
        )}
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
        <div className="control-section-title">网络状态</div>
        <div className="network-status">
          <span className={`network-dot ${isOnline ? 'online' : 'offline'}`}></span>
          <span style={{ color: isOnline ? '#4caf50' : '#f44336', fontSize: '13px' }}>
            {isOnline ? (isReconnecting ? '重连中...' : '网络正常') : '网络断开'}
          </span>
        </div>
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
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ff9800' }}></div>
          <span>待维保</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#2196f3' }}></div>
          <span>维保中</span>
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
