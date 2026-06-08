import { useState, useEffect, useRef } from 'react'
import { useRecordingStore } from '../store/recordingStore'
import { captureScreenshotWithTimestamp } from '../utils/exportUtils'

interface RecordingPanelProps {
  canvas?: HTMLCanvasElement | null
  onClose: () => void
}

export function RecordingPanel({ canvas, onClose }: RecordingPanelProps) {
  const {
    recordings,
    selectedRecordingId,
    isRecording,
    isPlaying,
    currentTime,
    playbackSpeed,
    currentFrameIndex,
    selectRecording,
    startRecording,
    stopRecording,
    startPlayback,
    pausePlayback,
    stopPlayback,
    setPlaybackSpeed,
    seekTo,
    takeScreenshot,
    deleteRecording,
    screenshots,
  } = useRecordingStore()

  const [activeTab, setActiveTab] = useState<'list' | 'player'>('list')
  const [recordingName, setRecordingName] = useState('')
  const [targetType, setTargetType] = useState<'line' | 'device' | 'area'>('line')
  const playbackRef = useRef<number | null>(null)

  const selectedRecording = recordings.find(r => r.id === selectedRecordingId)

  useEffect(() => {
    if (isPlaying && selectedRecording) {
      const step = () => {
        const store = useRecordingStore.getState()
        const nextTime = store.currentTime + (1000 / 30) * store.playbackSpeed
        
        if (nextTime >= (selectedRecording.endTime || selectedRecording.startTime + selectedRecording.duration)) {
          stopPlayback()
          return
        }
        
        seekTo(nextTime)
        playbackRef.current = requestAnimationFrame(step)
      }
      playbackRef.current = requestAnimationFrame(step)
    }
    
    return () => {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current)
      }
    }
  }, [isPlaying, selectedRecordingId])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}分${seconds}秒`
  }

  const handleStartRecording = () => {
    const name = recordingName || `录制_${new Date().toLocaleString()}`
    startRecording(name, targetType)
  }

  const handleStopRecording = () => {
    stopRecording()
    setRecordingName('')
  }

  const handleTakeScreenshot = () => {
    if (canvas) {
      captureScreenshotWithTimestamp(canvas)
      const dataUrl = canvas.toDataURL('image/png')
      takeScreenshot(dataUrl)
    }
  }

  const handlePlaybackSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedRecording) return
    const progress = parseFloat(e.target.value)
    const targetTime = selectedRecording.startTime + (selectedRecording.duration * progress / 100)
    seekTo(targetTime)
  }

  const progress = selectedRecording && selectedRecording.duration > 0
    ? ((currentTime - selectedRecording.startTime) / selectedRecording.duration) * 100
    : 0

  return (
    <div className="recording-panel">
      <div className="panel-header">
        <span className="panel-title">🎬 录播回放</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-tabs">
        <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          录制列表
        </button>
        <button className={`tab-btn ${activeTab === 'player' ? 'active' : ''}`} onClick={() => setActiveTab('player')}>
          回放控制
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="panel-content">
          <div className="recording-controls">
            <h4>录制控制</h4>
            {!isRecording ? (
              <>
                <div className="form-group">
                  <label>录制名称</label>
                  <input
                    type="text"
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="请输入录制名称"
                  />
                </div>
                <div className="form-group">
                  <label>录制范围</label>
                  <div className="target-options">
                    {(['line', 'device', 'area'] as const).map(t => (
                      <label key={t} className="target-option">
                        <input
                          type="radio"
                          name="targetType"
                          value={t}
                          checked={targetType === t}
                          onChange={(e) => setTargetType(e.target.value as any)}
                        />
                        <span>{t === 'line' ? '产线' : t === 'device' ? '设备' : '区域'}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button className="action-btn primary full-width" onClick={handleStartRecording}>
                  开始录制
                </button>
              </>
            ) : (
              <div className="recording-status">
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  <span>录制中...</span>
                </div>
                <button className="action-btn danger full-width" onClick={handleStopRecording}>
                  停止录制
                </button>
              </div>
            )}
          </div>

          <div className="recording-list">
            <h4>历史录制</h4>
            {recordings.length === 0 ? (
              <p style={{ color: '#7a8fa6', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                暂无录制记录
              </p>
            ) : (
              recordings.map(rec => (
                <div
                  key={rec.id}
                  className={`recording-card ${selectedRecordingId === rec.id ? 'selected' : ''}`}
                  onClick={() => selectRecording(rec.id)}
                >
                  <div className="recording-header">
                    <span className="recording-name">{rec.name}</span>
                  </div>
                  <div className="recording-meta">
                    <span>{formatDuration(rec.duration)}</span>
                    <span>{rec.frameCount} 帧</span>
                    <span>{(rec.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="recording-footer">
                    <span style={{ fontSize: '11px', color: '#7a8fa6' }}>
                      {new Date(rec.startTime).toLocaleString()}
                    </span>
                    <button
                      className="mini-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteRecording(rec.id)
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'player' && (
        <div className="panel-content">
          {!selectedRecording ? (
            <p style={{ color: '#7a8fa6', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
              请从列表中选择一个录制文件
            </p>
          ) : (
            <>
              <div className="player-info">
                <h4>{selectedRecording.name}</h4>
                <p style={{ fontSize: '12px', color: '#7a8fa6' }}>
                  时长：{formatDuration(selectedRecording.duration)} | 
                  帧数：{selectedRecording.frameCount} | 
                  当前帧：{currentFrameIndex + 1}
                </p>
              </div>

              <div className="progress-section">
                <div className="time-display">
                  <span>{formatTime(currentTime - selectedRecording.startTime)}</span>
                  <span>{formatTime(selectedRecording.duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handlePlaybackSeek}
                  className="progress-slider"
                />
              </div>

              <div className="playback-controls">
                <button className="play-btn" onClick={() => { if (isPlaying) pausePlayback(); else startPlayback() }}>
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <button className="play-btn small" onClick={stopPlayback}>⏹️</button>
                
                <div className="speed-control">
                  <span style={{ fontSize: '12px', color: '#7a8fa6' }}>倍速：</span>
                  {[0.5, 1, 2, 4].map(speed => (
                    <button
                      key={speed}
                      className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => setPlaybackSpeed(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="player-actions">
                <button className="action-btn" onClick={handleTakeScreenshot}>
                  📷 截图
                </button>
                <button className="action-btn" onClick={() => {
                  const data = useRecordingStore.getState().exportRecording(selectedRecording.id)
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${selectedRecording.name}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}>
                  💾 导出数据
                </button>
              </div>

              {screenshots.length > 0 && (
                <div className="screenshots-section">
                  <h4>本次截图 ({screenshots.length})</h4>
                  <div className="screenshot-grid">
                    {screenshots.slice(-6).map((s, i) => (
                      <div key={i} className="screenshot-thumb">
                        <img src={s.dataUrl} alt={`截图${i + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
