import { useState } from 'react'
import { useAnnotationStore } from '../store/annotationStore'
import type { AnnotationType } from '../types'

interface AnnotationPanelProps {
  onClose: () => void
  onAddMode?: (type: AnnotationType) => void
  currentPosition?: { x: number; y: number; z: number }
}

const typeLabels: Record<AnnotationType, string> = {
  note: '备注',
  issue: '问题',
  warning: '警告',
  info: '信息',
}

const typeColors: Record<AnnotationType, string> = {
  note: '#2196f3',
  issue: '#f44336',
  warning: '#ff9800',
  info: '#9c27b0',
}

export function AnnotationPanel({ onClose, onAddMode, currentPosition }: AnnotationPanelProps) {
  const {
    annotations,
    selectedAnnotationId,
    isAddingAnnotation,
    addingType,
    selectAnnotation,
    addAnnotation,
    deleteAnnotation,
    toggleResolved,
    setAddingMode,
    getUnresolvedCount,
  } = useAnnotationStore()

  const [activeType, setActiveType] = useState<AnnotationType | 'all'>('all')
  const [showResolved, setShowResolved] = useState(true)
  const [newAnnotation, setNewAnnotation] = useState({
    title: '',
    content: '',
    author: '当前用户',
  })

  const filteredAnnotations = annotations.filter(a => {
    if (activeType !== 'all' && a.type !== activeType) return false
    if (!showResolved && a.resolved) return false
    return true
  })

  const selectedAnnotation = selectedAnnotationId ? annotations.find(a => a.id === selectedAnnotationId) : null

  const handleStartAdd = (type: AnnotationType) => {
    setAddingMode(true, type)
    if (onAddMode) onAddMode(type)
  }

  const handleCancelAdd = () => {
    setAddingMode(false)
    setNewAnnotation({ title: '', content: '', author: '当前用户' })
  }

  const handleAddAnnotation = () => {
    if (!newAnnotation.title.trim() || !addingType || !currentPosition) return
    
    addAnnotation({
      position: { ...currentPosition },
      type: addingType,
      title: newAnnotation.title.trim(),
      content: newAnnotation.content.trim(),
      author: newAnnotation.author || '当前用户',
      resolved: false,
    })
    
    setNewAnnotation({ title: '', content: '', author: '当前用户' })
  }

  return (
    <div className="annotation-panel">
      <div className="panel-header">
        <span className="panel-title">📌 模型标注</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="annotation-stats">
        <div className="stat-chip">
          <span className="stat-value">{annotations.length}</span>
          <span className="stat-label">总数</span>
        </div>
        <div className="stat-chip" style={{ borderColor: '#f44336' }}>
          <span className="stat-value" style={{ color: '#f44336' }}>{getUnresolvedCount()}</span>
          <span className="stat-label">未解决</span>
        </div>
      </div>

      {isAddingAnnotation ? (
        <div className="add-annotation-section">
          <h4>添加{typeLabels[addingType!]}标注</h4>
          <p style={{ fontSize: '12px', color: '#7a8fa6', marginBottom: '12px' }}>
            点击场景中的位置以确认标注点
          </p>
          {currentPosition && (
            <p style={{ fontSize: '11px', color: '#4fc3f7', marginBottom: '12px' }}>
              位置：({currentPosition.x.toFixed(1)}, {currentPosition.y.toFixed(1)}, {currentPosition.z.toFixed(1)})
            </p>
          )}
          <div className="form-group">
            <label>标题</label>
            <input
              type="text"
              value={newAnnotation.title}
              onChange={(e) => setNewAnnotation({ ...newAnnotation, title: e.target.value })}
              placeholder="标注标题"
            />
          </div>
          <div className="form-group">
            <label>内容</label>
            <textarea
              value={newAnnotation.content}
              onChange={(e) => setNewAnnotation({ ...newAnnotation, content: e.target.value })}
              placeholder="详细描述"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>作者</label>
            <input
              type="text"
              value={newAnnotation.author}
              onChange={(e) => setNewAnnotation({ ...newAnnotation, author: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button className="action-btn" onClick={handleCancelAdd}>
              取消
            </button>
            <button className="action-btn primary" onClick={handleAddAnnotation}>
              确认添加
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="quick-add">
            <span style={{ fontSize: '12px', color: '#7a8fa6' }}>快速添加：</span>
            {(Object.keys(typeLabels) as AnnotationType[]).map(type => (
              <button
                key={type}
                className="quick-add-btn"
                style={{ borderColor: typeColors[type], color: typeColors[type] }}
                onClick={() => handleStartAdd(type)}
              >
                + {typeLabels[type]}
              </button>
            ))}
          </div>

          <div className="filter-bar">
            <div className="type-filters">
              <button
                className={`type-filter ${activeType === 'all' ? 'active' : ''}`}
                onClick={() => setActiveType('all')}
              >
                全部
              </button>
              {(Object.keys(typeLabels) as AnnotationType[]).map(type => (
                <button
                  key={type}
                  className={`type-filter ${activeType === type ? 'active' : ''}`}
                  style={activeType === type ? { background: typeColors[type] + '20', color: typeColors[type] } : {}}
                  onClick={() => setActiveType(type)}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
              />
              <span>显示已解决</span>
            </label>
          </div>

          <div className="annotation-list">
            {filteredAnnotations.length === 0 ? (
              <p style={{ color: '#7a8fa6', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                暂无标注
              </p>
            ) : (
              filteredAnnotations.map(ann => (
                <div
                  key={ann.id}
                  className={`annotation-card ${selectedAnnotationId === ann.id ? 'selected' : ''} ${ann.resolved ? 'resolved' : ''}`}
                  onClick={() => selectAnnotation(ann.id)}
                >
                  <div className="annotation-header">
                    <span
                      className="annotation-type-badge"
                      style={{ background: typeColors[ann.type] + '20', color: typeColors[ann.type] }}
                    >
                      {typeLabels[ann.type]}
                    </span>
                    {ann.resolved && <span className="resolved-badge">已解决</span>}
                  </div>
                  <div className="annotation-title">{ann.title}</div>
                  <p className="annotation-content">{ann.content}</p>
                  <div className="annotation-footer">
                    <span>{ann.author}</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="annotation-actions">
                    <button
                      className="mini-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleResolved(ann.id)
                      }}
                    >
                      {ann.resolved ? '标记未解决' : '标记已解决'}
                    </button>
                    <button
                      className="mini-btn danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('确定删除该标注？')) deleteAnnotation(ann.id)
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedAnnotation && (
            <div className="annotation-detail">
              <h4>标注详情</h4>
              <p><strong>类型：</strong>
                <span style={{ color: typeColors[selectedAnnotation.type] }}>
                  {typeLabels[selectedAnnotation.type]}
                </span>
              </p>
              <p><strong>标题：</strong>{selectedAnnotation.title}</p>
              <p><strong>内容：</strong>{selectedAnnotation.content}</p>
              <p><strong>作者：</strong>{selectedAnnotation.author}</p>
              <p><strong>创建时间：</strong>{new Date(selectedAnnotation.createdAt).toLocaleString()}</p>
              <p><strong>状态：</strong>{selectedAnnotation.resolved ? '已解决' : '未解决'}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
