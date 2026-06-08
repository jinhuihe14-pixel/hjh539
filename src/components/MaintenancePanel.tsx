import { useState } from 'react'
import { useMaintenanceStore } from '../store/maintenanceStore'
import { useDeviceStore } from '../store/deviceStore'
import type { MaintenancePriority, MaintenanceStatus } from '../types'

interface MaintenancePanelProps {
  onClose: () => void
}

const statusLabels: Record<MaintenanceStatus, string> = {
  pending: '待维保',
  inProgress: '维保中',
  completed: '已完成',
}

const priorityLabels: Record<MaintenancePriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

const priorityColors: Record<MaintenancePriority, string> = {
  low: '#9e9e9e',
  medium: '#2196f3',
  high: '#ff9800',
  urgent: '#f44336',
}

export function MaintenancePanel({ onClose }: MaintenancePanelProps) {
  const { orderList, selectedOrderId, selectOrder, getOrdersByStatus, updateOrderStatus, assignOrder, createOrder } = useMaintenanceStore()
  const { deviceList } = useDeviceStore()
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'all'>('all')
  const [newOrder, setNewOrder] = useState({
    deviceId: '',
    title: '',
    description: '',
    priority: 'medium' as MaintenancePriority,
  })

  const filteredOrders = filterStatus === 'all' ? orderList : getOrdersByStatus(filterStatus)
  const selectedOrder = selectedOrderId ? orderList.find(o => o.id === selectedOrderId) : null

  const handleCreateOrder = () => {
    if (!newOrder.deviceId || !newOrder.title) return
    
    const device = deviceList.find(d => d.id === newOrder.deviceId)
    if (!device) return

    createOrder(newOrder.deviceId, device.name, newOrder.title, newOrder.description, newOrder.priority)
    setNewOrder({ deviceId: '', title: '', description: '', priority: 'medium' })
    setActiveTab('list')
  }

  const handleAssign = (orderId: string) => {
    const technician = prompt('请输入维修人员姓名：', '张工')
    if (technician) {
      assignOrder(orderId, technician)
    }
  }

  const handleUpdateProgress = (orderId: string) => {
    const progressStr = prompt('请输入进度百分比 (0-100)：', '50')
    if (progressStr) {
      const progress = parseInt(progressStr)
      if (!isNaN(progress) && progress >= 0 && progress <= 100) {
        useMaintenanceStore.getState().updateOrderProgress(orderId, progress)
        if (progress === 100) {
          updateOrderStatus(orderId, 'completed')
        }
      }
    }
  }

  return (
    <div className="maintenance-panel">
      <div className="panel-header">
        <span className="panel-title">🔧 维保工单管理</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-tabs">
        <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          工单列表
        </button>
        <button className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
          新建工单
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="panel-content">
          <div className="filter-bar">
            <span style={{ fontSize: '12px', color: '#7a8fa6' }}>状态筛选：</span>
            {(['all', 'pending', 'inProgress', 'completed'] as const).map(status => (
              <button
                key={status}
                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? '全部' : statusLabels[status]}
              </button>
            ))}
          </div>

          <div className="order-list">
            {filteredOrders.length === 0 ? (
              <p style={{ color: '#7a8fa6', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                暂无工单
              </p>
            ) : (
              filteredOrders.map(order => (
                <div
                  key={order.id}
                  className={`order-card ${selectedOrderId === order.id ? 'selected' : ''}`}
                  onClick={() => selectOrder(order.id)}
                >
                  <div className="order-header">
                    <span className="order-title">{order.title}</span>
                    <span
                      className="priority-badge"
                      style={{ background: priorityColors[order.priority] + '20', color: priorityColors[order.priority] }}
                    >
                      {priorityLabels[order.priority]}
                    </span>
                  </div>
                  <div className="order-meta">
                    <span>{order.deviceName}</span>
                    <span className={`status-badge status-${order.status}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  {order.status === 'inProgress' && (
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${order.progress}%` }}></div>
                    </div>
                  )}
                  <div className="order-footer">
                    <span style={{ fontSize: '11px', color: '#7a8fa6' }}>
                      创建于 {new Date(order.createTime).toLocaleString()}
                    </span>
                    {order.technician && (
                      <span style={{ fontSize: '11px', color: '#4fc3f7' }}>
                        负责人：{order.technician}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedOrder && (
            <div className="order-detail">
              <div className="detail-section">
                <h4>工单详情</h4>
                <p><strong>工单编号：</strong>{selectedOrder.id.toUpperCase()}</p>
                <p><strong>工单标题：</strong>{selectedOrder.title}</p>
                <p><strong>设备名称：</strong>{selectedOrder.deviceName}</p>
                <p><strong>问题描述：</strong>{selectedOrder.description}</p>
                <p><strong>优先级：</strong>
                  <span style={{ color: priorityColors[selectedOrder.priority] }}>
                    {priorityLabels[selectedOrder.priority]}
                  </span>
                </p>
                <p><strong>状态：</strong>{statusLabels[selectedOrder.status]}</p>
                {selectedOrder.technician && <p><strong>维修人员：</strong>{selectedOrder.technician}</p>}
              </div>

              {selectedOrder.parts.length > 0 && (
                <div className="detail-section">
                  <h4>更换配件清单</h4>
                  {selectedOrder.parts.map(part => (
                    <div key={part.id} className="part-item">
                      <span>{part.name}</span>
                      <span>{part.quantity} {part.unit}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedOrder.history.length > 0 && (
                <div className="detail-section">
                  <h4>历史维修记录</h4>
                  {selectedOrder.history.map(record => (
                    <div key={record.id} className="history-record">
                      <div className="history-header">
                        <span className="history-type">{record.type}</span>
                        <span style={{ fontSize: '11px', color: '#7a8fa6' }}>
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#a0b4c8', marginTop: '4px' }}>
                        {record.description}
                      </p>
                      <p style={{ fontSize: '11px', color: '#7a8fa6', marginTop: '4px' }}>
                        维修人员：{record.technician} | 耗时：{record.duration}分钟
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="detail-actions">
                {selectedOrder.status === 'pending' && (
                  <button className="action-btn primary" onClick={() => handleAssign(selectedOrder.id)}>
                    派单
                  </button>
                )}
                {selectedOrder.status === 'inProgress' && (
                  <button className="action-btn" onClick={() => handleUpdateProgress(selectedOrder.id)}>
                    更新进度
                  </button>
                )}
                {selectedOrder.status === 'pending' && (
                  <button className="action-btn" onClick={() => updateOrderStatus(selectedOrder.id, 'inProgress')}>
                    开始维修
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="panel-content">
          <div className="form-group">
            <label>选择设备</label>
            <select value={newOrder.deviceId} onChange={(e) => setNewOrder({ ...newOrder, deviceId: e.target.value })}>
              <option value="">请选择设备</option>
              {deviceList.map(device => (
                <option key={device.id} value={device.id}>{device.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>工单标题</label>
            <input
              type="text"
              value={newOrder.title}
              onChange={(e) => setNewOrder({ ...newOrder, title: e.target.value })}
              placeholder="请输入工单标题"
            />
          </div>
          <div className="form-group">
            <label>问题描述</label>
            <textarea
              value={newOrder.description}
              onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
              placeholder="请详细描述问题"
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>优先级</label>
            <div className="priority-options">
              {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                <label key={p} className="priority-option">
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={newOrder.priority === p}
                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value as MaintenancePriority })}
                  />
                  <span style={{ color: priorityColors[p] }}>{priorityLabels[p]}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="action-btn primary full-width" onClick={handleCreateOrder}>
            创建工单
          </button>
        </div>
      )}
    </div>
  )
}
