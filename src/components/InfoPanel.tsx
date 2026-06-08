import ReactECharts from 'echarts-for-react'
import { useDeviceStore } from '../store/deviceStore'
import { useMaintenanceStore } from '../store/maintenanceStore'

interface InfoPanelProps {
  onClose: () => void
  onOpenMaintenance?: () => void
}

export function InfoPanel({ onClose, onOpenMaintenance }: InfoPanelProps) {
  const { devices, selectedDeviceId } = useDeviceStore()
  const { getOrdersByDevice } = useMaintenanceStore()
  
  const selectedDevice = selectedDeviceId ? devices.get(selectedDeviceId) : null
  const deviceOrders = selectedDeviceId ? getOrdersByDevice(selectedDeviceId) : []

  if (!selectedDevice) {
    return (
      <div className="info-panel">
        <div className="info-panel-header">
          <span className="info-panel-title">设备信息</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <p style={{ color: '#7a8fa6', fontSize: '13px' }}>
          点击场景中的设备查看详细信息
        </p>
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    normal: '正常运行',
    standby: '待机',
    fault: '故障',
    maintenance: '维修中',
  }

  const maintenanceStatusLabels: Record<string, string> = {
    pending: '待维保',
    inProgress: '维保中',
    completed: '已完成',
  }

  const chartOption = {
    backgroundColor: 'transparent',
    grid: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 40,
    },
    xAxis: {
      type: 'category',
      data: selectedDevice.historyData?.map(d => d.time) || [],
      axisLine: { lineStyle: { color: '#2a4a6a' } },
      axisLabel: { color: '#7a8fa6', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#2a4a6a' } },
      axisLabel: { color: '#7a8fa6', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a3a5c' } },
    },
    series: [{
      data: selectedDevice.historyData?.map(d => d.value) || [],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#4fc3f7', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(79, 195, 247, 0.4)' },
            { offset: 1, color: 'rgba(79, 195, 247, 0)' },
          ],
        },
      },
      itemStyle: { color: '#4fc3f7' },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(13, 33, 55, 0.95)',
      borderColor: '#2a4a6a',
      textStyle: { color: '#e0e6f0' },
    },
  }

  return (
    <div className="info-panel">
      <div className="info-panel-header">
        <span className="info-panel-title">设备详情</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="device-card">
        <div className="device-name">{selectedDevice.name}</div>
        <span className={`device-status status-${selectedDevice.status}`}>
          {statusLabels[selectedDevice.status]}
        </span>
        <p style={{ fontSize: '12px', color: '#7a8fa6', marginTop: '8px' }}>
          {selectedDevice.description}
        </p>
      </div>

      <div className="device-card">
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#4fc3f7' }}>
          运行参数
        </div>
        <div className="device-params">
          {selectedDevice.parameters.map((param, index) => (
            <div key={index} className="param-item">
              <div className="param-label">{param.name}</div>
              <div className="param-value">
                {param.value.toFixed(2)} {param.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="device-card">
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#4fc3f7' }}>
          {selectedDevice.parameters[0]?.name || '参数'} - 历史趋势
        </div>
        <div className="chart-container">
          <ReactECharts 
            option={chartOption} 
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
          />
        </div>
      </div>

      <div className="device-card">
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#4fc3f7' }}>
          设备信息
        </div>
        <div className="device-params">
          <div className="param-item">
            <div className="param-label">设备编号</div>
            <div className="param-value">{selectedDevice.id.toUpperCase()}</div>
          </div>
          <div className="param-item">
            <div className="param-label">设备类型</div>
            <div className="param-value">{selectedDevice.type.toUpperCase()}</div>
          </div>
          <div className="param-item">
            <div className="param-label">位置坐标</div>
            <div className="param-value">
              ({selectedDevice.position.x.toFixed(1)}, {selectedDevice.position.z.toFixed(1)})
            </div>
          </div>
          <div className="param-item">
            <div className="param-label">最后更新</div>
            <div className="param-value">
              {new Date(selectedDevice.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="device-card">
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#4fc3f7' }}>
          维保工单
        </div>
        {deviceOrders.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#7a8fa6' }}>暂无维保工单</p>
        ) : (
          deviceOrders.slice(0, 3).map(order => (
            <div key={order.id} className="order-item" onClick={onOpenMaintenance}>
              <div className="order-item-header">
                <span className="order-item-title">{order.title}</span>
                <span className={`status-badge status-${order.status}`}>
                  {maintenanceStatusLabels[order.status]}
                </span>
              </div>
              {order.status === 'inProgress' && (
                <div className="progress-bar small">
                  <div className="progress-fill" style={{ width: `${order.progress}%` }}></div>
                </div>
              )}
            </div>
          ))
        )}
        <button 
          className="control-btn" 
          style={{ marginTop: '10px' }}
          onClick={onOpenMaintenance}
        >
          🔧 查看全部工单
        </button>
      </div>

      <div className="device-card">
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#4fc3f7' }}>
          快捷操作
        </div>
        <button className="control-btn" style={{ marginBottom: '8px' }}>
          📊 查看报表
        </button>
        <button className="control-btn" style={{ marginBottom: '8px' }}>
          🎯 定位设备
        </button>
        <button className="control-btn" onClick={onOpenMaintenance}>
          📝 创建维保工单
        </button>
      </div>
    </div>
  )
}
