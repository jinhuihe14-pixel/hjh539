import { create } from 'zustand'
import type { Recording, RecordedFrame, Device } from '../types'

interface RecordingStore {
  recordings: Recording[]
  selectedRecordingId: string | null
  isRecording: boolean
  isPlaying: boolean
  currentTime: number
  playbackSpeed: number
  currentFrameIndex: number
  recordingStartTime: number
  recordedFrames: RecordedFrame[]
  screenshots: { time: number; dataUrl: string }[]
  recordingName: string
  recordingTargetType: 'line' | 'device' | 'area'
  recordingTargetId?: string
  recordingDescription: string

  startRecording: (name: string, targetType: 'line' | 'device' | 'area', targetId?: string, description?: string) => void
  stopRecording: () => Recording
  pauseRecording: () => void
  resumeRecording: () => void
  addFrame: (frame: RecordedFrame) => void

  selectRecording: (id: string | null) => void
  startPlayback: () => void
  pausePlayback: () => void
  stopPlayback: () => void
  setPlaybackSpeed: (speed: number) => void
  seekTo: (time: number) => void
  nextFrame: () => RecordedFrame | undefined
  prevFrame: () => RecordedFrame | undefined
  getCurrentFrame: () => RecordedFrame | null

  deleteRecording: (id: string) => void
  takeScreenshot: (dataUrl: string) => void
  exportRecording: (id: string) => string

  initMockData: () => void
}

let recordingIdCounter = 2000

export const useRecordingStore = create<RecordingStore>((set, get) => ({
  recordings: [],
  selectedRecordingId: null,
  isRecording: false,
  isPlaying: false,
  currentTime: 0,
  playbackSpeed: 1,
  currentFrameIndex: 0,
  recordingStartTime: 0,
  recordedFrames: [],
  screenshots: [],
  recordingName: '',
  recordingTargetType: 'line',
  recordingTargetId: undefined,
  recordingDescription: '',

  startRecording: (name, targetType, targetId, description) => {
    set({
      isRecording: true,
      recordingStartTime: Date.now(),
      recordedFrames: [],
      screenshots: [],
      recordingName: name || `录制_${new Date().toLocaleString()}`,
      recordingTargetType: targetType,
      recordingTargetId: targetId,
      recordingDescription: description || '',
    })
  },

  stopRecording: () => {
    const { recordedFrames, recordingStartTime, recordingName, recordingTargetType, recordingTargetId, recordingDescription } = get()
    const endTime = Date.now()
    const duration = endTime - recordingStartTime

    const newRecording: Recording = {
      id: `rec-${++recordingIdCounter}`,
      name: recordingName,
      description: recordingDescription,
      startTime: recordingStartTime,
      endTime,
      duration,
      targetType: recordingTargetType,
      targetId: recordingTargetId,
      frames: recordedFrames,
      frameCount: recordedFrames.length,
      size: recordedFrames.length * 200,
    }

    set((state) => ({
      recordings: [...state.recordings, newRecording],
      isRecording: false,
      recordedFrames: [],
      recordingStartTime: 0,
    }))

    return newRecording
  },

  pauseRecording: () => set({ isRecording: false }),

  resumeRecording: () => set({ isRecording: true }),

  addFrame: (frame) => {
    if (!get().isRecording) return
    set((state) => ({
      recordedFrames: [...state.recordedFrames, frame],
    }))
  },

  selectRecording: (id) => {
    const recording = id ? get().recordings.find(r => r.id === id) : null
    set({
      selectedRecordingId: id,
      currentTime: recording ? recording.startTime : 0,
      currentFrameIndex: 0,
      isPlaying: false,
    })
  },

  startPlayback: () => set({ isPlaying: true }),

  pausePlayback: () => set({ isPlaying: false }),

  stopPlayback: () => {
    const { selectedRecordingId, recordings } = get()
    const recording = recordings.find(r => r.id === selectedRecordingId)
    set({
      isPlaying: false,
      currentTime: recording?.startTime || 0,
      currentFrameIndex: 0,
    })
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  seekTo: (time) => {
    const { selectedRecordingId, recordings } = get()
    const recording = recordings.find(r => r.id === selectedRecordingId)
    if (!recording) return

    const frameIndex = Math.floor((time - recording.startTime) / (recording.duration / recording.frameCount))
    set({
      currentTime: time,
      currentFrameIndex: Math.max(0, Math.min(recording.frameCount - 1, Math.floor(frameIndex))),
    })
  },

  nextFrame: () => {
    const { selectedRecordingId, recordings, currentFrameIndex } = get()
    const recording = recordings.find(r => r.id === selectedRecordingId)
    if (!recording) return undefined

    const nextIndex = Math.min(recording.frameCount - 1, currentFrameIndex + 1)
    set({ currentFrameIndex: nextIndex })
    return recording.frames[nextIndex]
  },

  prevFrame: () => {
    const { selectedRecordingId, recordings, currentFrameIndex } = get()
    const recording = recordings.find(r => r.id === selectedRecordingId)
    if (!recording) return undefined

    const prevIndex = Math.max(0, currentFrameIndex - 1)
    set({ currentFrameIndex: prevIndex })
    return recording.frames[prevIndex]
  },

  getCurrentFrame: () => {
    const { selectedRecordingId, recordings, currentFrameIndex } = get()
    const recording = recordings.find(r => r.id === selectedRecordingId)
    return recording?.frames[currentFrameIndex] || null
  },

  deleteRecording: (id) => {
    set((state) => ({
      recordings: state.recordings.filter(r => r.id !== id),
      selectedRecordingId: state.selectedRecordingId === id ? null : state.selectedRecordingId,
    }))
  },

  takeScreenshot: (dataUrl) => {
    const { currentTime, isRecording, recordingStartTime } = get()
    const time = isRecording ? Date.now() - recordingStartTime : currentTime
    set((state) => ({
      screenshots: [...state.screenshots, { time, dataUrl }],
    }))
  },

  exportRecording: (id) => {
    const { recordings } = get()
    const recording = recordings.find(r => r.id === id)
    if (!recording) return ''
    return JSON.stringify(recording, null, 2)
  },

  initMockData: () => {
    const generateMockFrames = (count: number, startTime: number): RecordedFrame[] => {
      const frames: RecordedFrame[] = []
      for (let i = 0; i < count; i++) {
        const timestamp = startTime + i * 2000
        frames.push({
          timestamp,
          cameraPosition: {
            x: 80 + Math.sin(i * 0.1) * 10,
            y: 70 + Math.cos(i * 0.05) * 5,
            z: 90 + Math.sin(i * 0.08) * 8,
          },
          cameraTarget: { x: 0, y: 2, z: 0 },
          deviceStates: [
            {
              deviceId: 'robot-001',
              status: i % 50 < 45 ? 'normal' : 'fault',
              parameters: [
                { name: '负载率', value: 60 + Math.random() * 30 },
                { name: '温度', value: 45 + Math.random() * 20 },
              ],
            },
            {
              deviceId: 'cnc-001',
              status: 'normal',
              parameters: [
                { name: '主轴转速', value: 3000 + Math.random() * 2000 },
              ],
            },
          ],
        })
      }
      return frames
    }

    const now = Date.now()
    const mockRecordings: Recording[] = [
      {
        id: 'rec-2001',
        name: '焊接产线日常运行',
        description: '2024年第一季度焊接区生产流程录制',
        startTime: now - 86400000,
        endTime: now - 86400000 + 300000,
        duration: 300000,
        targetType: 'line',
        targetId: 'line-1',
        frames: generateMockFrames(150, now - 86400000),
        frameCount: 150,
        size: 30000,
      },
      {
        id: 'rec-2002',
        name: 'CNC加工中心故障回放',
        description: 'M3设备故障发生过程记录',
        startTime: now - 172800000,
        endTime: now - 172800000 + 120000,
        duration: 120000,
        targetType: 'device',
        targetId: 'cnc-003',
        frames: generateMockFrames(60, now - 172800000),
        frameCount: 60,
        size: 12000,
      },
      {
        id: 'rec-2003',
        name: '装配工艺培训视频',
        description: '新员工培训用标准装配流程演示',
        startTime: now - 259200000,
        endTime: now - 259200000 + 180000,
        duration: 180000,
        targetType: 'area',
        frames: generateMockFrames(90, now - 259200000),
        frameCount: 90,
        size: 18000,
      },
    ]

    set({ recordings: mockRecordings })
  },
}))
