import { useState } from 'react'
import { useInspectionStore } from '../store/inspectionStore'
import type { InspectionPoint } from '../types'

interface InspectionPanelProps {
  onClose: () => void
  onStartPatrol?: (routeId: string) => void
  onShowRoute?: (routeId: string) => void
  onAddPoint?: (point: InspectionPoint) => void
  currentCameraPos?: { x: number; y: number; z: number }
  currentCameraTarget?: { x: number; y: number; z: number }
}

export function InspectionPanel({
  onClose,
  onStartPatrol,
  onShowRoute,
  onAddPoint,
  currentCameraPos,
  currentCameraTarget,
}: InspectionPanelProps) {
  const {
    routeList,
    selectedRouteId,
    isPatrolling,
    currentPatrolPointIndex,
    records,
    isEditingRoute,
    tempPoints,
    selectRoute,
    createRoute,
    deleteRoute,
    duplicateRoute,
    toggleRouteEnabled,
    startEditingRoute,
    addPointToRoute,
    removePointFromRoute,
    saveRouteEdit,
    cancelRouteEdit,
    startPatrol,
    advancePatrolPoint,
    completePatrol,
    abortPatrol,
    markPointAbnormal,
    getCurrentPatrolPoint,
  } = useInspectionStore()

  const [activeTab, setActiveTab] = useState<'routes' | 'records' | 'editor'>('routes')
  const [newRouteName, setNewRouteName] = useState('')
  const [newRouteGroup, setNewRouteGroup] = useState('生产班组')
  const [showAddPointForm, setShowAddPointForm] = useState(false)
  const [newPointName, setNewPointName] = useState('')
  const [newPointDuration, setNewPointDuration] = useState(30)

  const selectedRoute = routeList.find(r => r.id === selectedRouteId)
  const currentPoint = getCurrentPatrolPoint()
  const displayPoints = isEditingRoute ? tempPoints : selectedRoute?.points || []

  const groups = [...new Set(routeList.map(r => r.group))]

  const handleCreateRoute = () => {
    if (!newRouteName.trim()) return
    createRoute(newRouteName.trim(), newRouteGroup)
    setNewRouteName('')
  }

  const handleAddCurrentView = () => {
    if (!currentCameraPos || !currentCameraTarget) {
      alert('请先在场景中定位到目标视角')
      return
    }
    const pointName = newPointName || `巡检点${tempPoints.length + 1}`
    const newPoint: InspectionPoint = {
      id: `pt-${Date.now()}`,
      name: pointName,
      position: { ...currentCameraPos },
      target: { ...currentCameraTarget },
      stayDuration: newPointDuration,
    }
    addPointToRoute(newPoint)
    if (onAddPoint) onAddPoint(newPoint)
    setShowAddPointForm(false)
    setNewPointName('')
  }

  const handleStartPatrol = (routeId: string) => {
    startPatrol(routeId)
    if (onStartPatrol) onStartPatrol(routeId)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0秒'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
  }

  return (
    <div className="inspection-panel">
      <div className="panel-header">
        <span className="panel-title">🔍 巡检管理</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-tabs">
        <button className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`} onClick={() => setActiveTab('routes')}>
          路线管理
        </button>
        <button className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>
          巡检记录
        </button>
        {isEditingRoute && (
          <button className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
            编辑中
          </button>
        )}
      </div>

      {activeTab === 'routes' && !isEditingRoute && (
        <div className="panel-content">
          <div className="create-route-section">
            <h4>新建路线</h4>
            <div className="form-group">
              <input
                type="text"
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
                placeholder="路线名称"
              />
            </div>
            <div className="form-group">
              <select value={newRouteGroup} onChange={(e) => setNewRouteGroup(e.target.value)}>
                <option value="生产班组">生产班组</option>
                <option value="安全班组">安全班组</option>
                <option value="维护班组">维护班组</option>
              </select>
            </div>
            <button className="action-btn primary full-width" onClick={handleCreateRoute}>
              创建路线
            </button>
          </div>

          {groups.map(group => (
            <div key={group} className="route-group">
              <h5>{group}</h5>
              {routeList.filter(r => r.group === group).map(route => (
                <div
                  key={route.id}
                  className={`route-card ${selectedRouteId === route.id ? 'selected' : ''} ${!route.enabled ? 'disabled' : ''}`}
                  onClick={() => {
                    selectRoute(route.id)
                    if (onShowRoute) onShowRoute(route.id)
                  }}
                >
                  <div className="route-header">
                    <span className="route-name">{route.name}</span>
                    <span className={`route-toggle ${route.enabled ? 'on' : 'off'}`}>
                      {route.enabled ? '启用' : '停用'}
                    </span>
                  </div>
                  <div className="route-meta">
                    <span>{route.points.length} 个点位</span>
                    <span>约 {formatDuration(route.totalDuration)}</span>
                  </div>
                  <div className="route-actions">
                    <button className="mini-btn" onClick={(e) => {
                      e.stopPropagation()
                      toggleRouteEnabled(route.id)
                    }}>
                      {route.enabled ? '停用' : '启用'}
                    </button>
                    <button className="mini-btn" onClick={(e) => {
                      e.stopPropagation()
                      startEditingRoute(route.id)
                      setActiveTab('editor')
                    }}>
                      编辑
                    </button>
                    <button className="mini-btn" onClick={(e) => {
                      e.stopPropagation()
                      duplicateRoute(route.id)
                    }}>
                      复制
                    </button>
                    <button className="mini-btn danger" onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('确定删除该路线？')) deleteRoute(route.id)
                    }}>
                      删除
                    </button>
                  </div>
                  {route.enabled && !isPatrolling && (
                    <button
                      className="action-btn primary full-width"
                      style={{ marginTop: '8px' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartPatrol(route.id)
                      }}
                    >
                      开始巡检
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {(activeTab === 'editor' && isEditingRoute) && (
        <div className="panel-content">
          <div className="editor-header">
            <h4>编辑路线点位</h4>
            <p style={{ fontSize: '12px', color: '#7a8fa6' }}>
              共 {tempPoints.length} 个点位
            </p>
          </div>

          <div className="add-point-section">
            {!showAddPointForm ? (
              <button className="action-btn full-width" onClick={() => setShowAddPointForm(true)}>
                + 添加当前视角为点位
              </button>
            ) : (
              <div className="add-point-form">
                <div className="form-group">
                  <label>点位名称</label>
                  <input
                    type="text"
                    value={newPointName}
                    onChange={(e) => setNewPointName(e.target.value)}
                    placeholder="点位名称"
                  />
                </div>
                <div className="form-group">
                  <label>停留时长 (秒)</label>
                  <input
                    type="number"
                    value={newPointDuration}
                    onChange={(e) => setNewPointDuration(parseInt(e.target.value) || 30)}
                    min="10"
                    step="10"
                  />
                </div>
                <div className="form-actions">
                  <button className="mini-btn" onClick={() => setShowAddPointForm(false)}>
                    取消
                  </button>
                  <button className="mini-btn primary" onClick={handleAddCurrentView}>
                    添加
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="point-list">
            {tempPoints.length === 0 ? (
              <p style={{ color: '#7a8fa6', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                暂无点位，请添加
              </p>
            ) : (
              tempPoints.map((point, index) => (
                <div key={point.id} className="point-item">
                  <div className="point-number">{index + 1}</div>
                  <div className="point-info">
                    <div className="point-name">{point.name}</div>
                    <div className="point-duration">
                      停留 {point.stayDuration || 30}秒
                    </div>
                  </div>
                  <button
                    className="mini-btn danger"
                    onClick={() => removePointFromRoute(point.id)}
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="editor-footer">
            <button className="action-btn" onClick={cancelRouteEdit}>
              取消
            </button>
            <button className="action-btn primary" onClick={saveRouteEdit}>
              保存
            </button>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="panel-content">
          {isPatrolling && currentPoint && (
            <div className="patrol-status-card">
              <div className="patrol-status-header">
                <span className="patrol-status-text">巡检进行中</span>
                <span className="patrol-dot"></span>
              </div>
              <div className="patrol-current-point">
                当前点位：{currentPoint.name}
              </div>
              <div className="patrol-progress">
                进度：{currentPatrolPointIndex + 1} / {selectedRoute?.points.length || 0}
              </div>
              <div className="patrol-actions">
                <button className="mini-btn" onClick={() => markPointAbnormal(currentPoint.id)}>
                  标记异常
                </button>
                <button className="mini-btn" onClick={() => advancePatrolPoint()}>
                  下一点
                </button>
                <button className="mini-btn primary" onClick={() => completePatrol()}>
                  完成
                </button>
                <button className="mini-btn danger" onClick={() => abortPatrol()}>
                  终止
                </button>
              </div>
            </div>
          )}

          <h4>历史记录</h4>
          {records.length === 0 ? (
            <p style={{ color: '#7a8fa6', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
              暂无巡检记录
            </p>
          ) : (
            records.map(record => (
              <div key={record.id} className="record-card">
                <div className="record-header">
                  <span className="record-name">{record.routeName}</span>
                  <span className={`record-status status-${record.status}`}>
                    {record.status === 'completed' ? '已完成' : record.status === 'inProgress' ? '进行中' : '已终止'}
                  </span>
                </div>
                <div className="record-meta">
                  <span>开始：{new Date(record.startTime).toLocaleString()}</span>
                </div>
                {record.endTime && (
                  <div className="record-meta">
                    <span>结束：{new Date(record.endTime).toLocaleString()}</span>
                  </div>
                )}
                <div className="record-stats">
                  <span>点位：{record.pointResults.filter(p => p.visited).length}/{record.pointResults.length}</span>
                  <span style={{ color: record.abnormalCount > 0 ? '#f44336' : '#4caf50' }}>
                    异常：{record.abnormalCount}
                  </span>
                </div>
                {record.operator && (
                  <div className="record-operator">
                    操作员：{record.operator}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
