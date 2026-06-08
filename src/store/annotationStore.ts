import { create } from 'zustand'
import type { Annotation, AnnotationType } from '../types'

interface AnnotationStore {
  annotations: Annotation[]
  selectedAnnotationId: string | null
  isAddingAnnotation: boolean
  addingType: AnnotationType | null

  initMockData: () => void
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => Annotation
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void
  deleteAnnotation: (id: string) => void
  selectAnnotation: (id: string | null) => void
  toggleResolved: (id: string) => void
  getAnnotationsByType: (type: AnnotationType) => Annotation[]
  getAnnotationsByDevice: (deviceId: string) => Annotation[]
  setAddingMode: (isAdding: boolean, type?: AnnotationType) => void
  getUnresolvedCount: () => number
}

let annotationIdCounter = 6000

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  annotations: [],
  selectedAnnotationId: null,
  isAddingAnnotation: false,
  addingType: null,

  initMockData: () => {
    const mockAnnotations: Annotation[] = [
      {
        id: 'ann-6001',
        position: { x: -20, y: 5, z: -15 },
        type: 'note',
        title: '焊接参数校准',
        content: '每天早班需要校准焊接电流和电压参数，确保焊接质量稳定',
        author: '张工',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        deviceId: 'robot-001',
        resolved: false,
      },
      {
        id: 'ann-6002',
        position: { x: 10, y: 5, z: 0 },
        type: 'issue',
        title: '主轴异响',
        content: 'CNC加工中心M3主轴运行时有异响，疑似轴承磨损，已上报维修',
        author: '李工',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        deviceId: 'cnc-003',
        resolved: false,
      },
      {
        id: 'ann-6003',
        position: { x: 28, y: 8, z: 5 },
        type: 'warning',
        title: '仓储温度偏高',
        content: '仓储区温度传感器显示温度略高，建议检查通风系统',
        author: '王工',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        resolved: true,
      },
      {
        id: 'ann-6004',
        position: { x: -5, y: 3, z: 0 },
        type: 'info',
        title: '传输线优化方案',
        content: '计划下月对主传输线进行速度升级，提升产能15%',
        author: '赵经理',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        deviceId: 'conv-001',
        resolved: false,
      },
      {
        id: 'ann-6005',
        position: { x: 0, y: 4, z: 15 },
        type: 'issue',
        title: '地面油污',
        content: '装配区地面有油污，存在安全隐患，已通知清洁部门',
        author: '安全员小陈',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        resolved: false,
      },
    ]

    set({ annotations: mockAnnotations })
  },

  addAnnotation: (annotation) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: `ann-${++annotationIdCounter}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      annotations: [...state.annotations, newAnnotation],
      isAddingAnnotation: false,
      addingType: null,
    }))

    return newAnnotation
  },

  updateAnnotation: (id, updates) => {
    set((state) => ({
      annotations: state.annotations.map(a =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      ),
    }))
  },

  deleteAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter(a => a.id !== id),
      selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
    }))
  },

  selectAnnotation: (id) => set({ selectedAnnotationId: id }),

  toggleResolved: (id) => {
    set((state) => ({
      annotations: state.annotations.map(a =>
        a.id === id ? { ...a, resolved: !a.resolved, updatedAt: new Date().toISOString() } : a
      ),
    }))
  },

  getAnnotationsByType: (type) => {
    return get().annotations.filter(a => a.type === type)
  },

  getAnnotationsByDevice: (deviceId) => {
    return get().annotations.filter(a => a.deviceId === deviceId)
  },

  setAddingMode: (isAdding, type) => set({
    isAddingAnnotation: isAdding,
    addingType: type || null,
  }),

  getUnresolvedCount: () => {
    return get().annotations.filter(a => !a.resolved).length
  },
}))
