import { useDeviceStore } from '../store/deviceStore'

export function HeaderBar() {
  const { deviceList } = useDeviceStore()

  const normalCount = deviceList.filter(d => d.status === 'normal').length
  const faultCount = deviceList.filter(d => d.status === 'fault').length
  const standbyCount = deviceList.filter(d => d.status === 'standby').length

  return (
    <header className="header-bar">
      <div className="header-title">智能制造数字孪生平台</div>
      <div className="header-stats">
        <div className="stat-item">
          <span className="stat-value">{deviceList.length}</span>
          <span className="stat-label">设备总数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#4caf50' }}>{normalCount}</span>
          <span className="stat-label">运行中</span>
        </div>
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#ffc107' }}>{standbyCount}</span>
          <span className="stat-label">待机</span>
        </div>
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#f44336' }}>{faultCount}</span>
          <span className="stat-label">故障</span>
        </div>
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#4fc3f7' }}>98.5%</span>
          <span className="stat-label">OEE</span>
        </div>
      </div>
    </header>
  )
}
