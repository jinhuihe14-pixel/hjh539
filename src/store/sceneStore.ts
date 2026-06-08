import { create } from 'zustand'
import type { ViewMode, InspectionPoint, WarehouseSlot, Camera, PipeNode } from '../types'

interface SceneStore {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  
  inspectionPoints: InspectionPoint[]
  currentInspectionIndex: number
  nextInspectionPoint: () => void
  prevInspectionPoint: () => void
  
  isSimulationRunning: boolean
  simulationSpeed: number
  toggleSimulation: () => void
  setSimulationSpeed: (speed: number) => void
  
  warehouseSlots: WarehouseSlot[]
  selectedSlotId: string | null
  initWarehouseData: () => void
  selectSlot: (id: string | null) => void
  locateMaterial: (materialId: string) => WarehouseSlot | undefined
  
  cameras: Camera[]
  selectedCameraId: string | null
  initCameraData: () => void
  selectCamera: (id: string | null) => void
  
  pipeNodes: PipeNode[]
  initPipeData: () => void
  highlightPipePath: (nodeId: string) => void
  
  showLabels: boolean
  toggleLabels: () => void
  
  showPipes: boolean
  togglePipes: () => void
  
  showCameras: boolean
  toggleCameras: () => void
  
  animationFrame: number
  setAnimationFrame: (frame: number) => void
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  viewMode: 'orbit',
  setViewMode: (mode) => set({ viewMode: mode }),

  inspectionPoints: [
    { id: 'insp-1', name: '入口巡检点', position: { x: -40, y: 15, z: 0 }, target: { x: 0, y: 2, z: 0 } },
    { id: 'insp-2', name: '焊接区巡检', position: { x: -20, y: 12, z: -25 }, target: { x: -20, y: 2, z: -10 } },
    { id: 'insp-3', name: '加工区巡检', position: { x: 15, y: 15, z: -25 }, target: { x: 10, y: 2, z: -10 } },
    { id: 'insp-4', name: '仓储区巡检', position: { x: 35, y: 20, z: 15 }, target: { x: 35, y: 5, z: 15 } },
    { id: 'insp-5', name: '装配区巡检', position: { x: -10, y: 12, z: 25 }, target: { x: -10, y: 2, z: 10 } },
  ],
  currentInspectionIndex: 0,
  nextInspectionPoint: () => {
    const { currentInspectionIndex, inspectionPoints } = get()
    set({ currentInspectionIndex: (currentInspectionIndex + 1) % inspectionPoints.length })
  },
  prevInspectionPoint: () => {
    const { currentInspectionIndex, inspectionPoints } = get()
    set({ currentInspectionIndex: (currentInspectionIndex - 1 + inspectionPoints.length) % inspectionPoints.length })
  },

  isSimulationRunning: false,
  simulationSpeed: 1,
  toggleSimulation: () => set((state) => ({ isSimulationRunning: !state.isSimulationRunning })),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

  warehouseSlots: [],
  selectedSlotId: null,
  initWarehouseData: () => {
    const slots: WarehouseSlot[] = []
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        for (let level = 0; level < 5; level++) {
          const id = `slot-${row}-${col}-${level}`
          const rand = Math.random()
          let status: WarehouseSlot['status'] = 'empty'
          if (rand > 0.3) status = 'occupied'
          else if (rand > 0.15) status = 'pending'
          
          slots.push({
            id,
            row,
            column: col,
            level,
            status,
            materialId: status !== 'empty' ? `MAT-${1000 + row * 100 + col * 10 + level}` : undefined,
            materialName: status !== 'empty' ? ['电子元件', '机械零件', '半成品', '成品'][Math.floor(Math.random() * 4)] : undefined,
            quantity: status !== 'empty' ? Math.floor(Math.random() * 100) + 10 : undefined,
            batch: status !== 'empty' ? `B2024${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}` : undefined,
          })
        }
      }
    }
    set({ warehouseSlots: slots })
  },
  selectSlot: (id) => set({ selectedSlotId: id }),
  locateMaterial: (materialId) => {
    return get().warehouseSlots.find(s => s.materialId === materialId)
  },

  cameras: [],
  selectedCameraId: null,
  initCameraData: () => {
    const cameras: Camera[] = [
      { id: 'cam-001', name: '入口摄像头', position: { x: -35, y: 8, z: 0 }, status: 'online', type: 'ptz' },
      { id: 'cam-002', name: '焊接区摄像头', position: { x: -20, y: 8, z: -20 }, status: 'online', type: 'fixed' },
      { id: 'cam-003', name: '加工区摄像头', position: { x: 10, y: 8, z: -20 }, status: 'online', type: 'fixed' },
      { id: 'cam-004', name: '仓储区摄像头', position: { x: 35, y: 12, z: 0 }, status: 'online', type: 'ptz' },
      { id: 'cam-005', name: '装配区摄像头', position: { x: -10, y: 8, z: 20 }, status: 'offline', type: 'fixed' },
      { id: 'cam-006', name: '出口摄像头', position: { x: 40, y: 8, z: 15 }, status: 'online', type: 'ptz' },
    ]
    set({ cameras })
  },
  selectCamera: (id) => set({ selectedCameraId: id }),

  pipeNodes: [],
  initPipeData: () => {
    const nodes: PipeNode[] = [
      { id: 'pipe-w-1', name: '主水管入口', position: { x: -45, y: 3, z: -25 }, type: 'water', status: 'normal', connections: ['pipe-w-2', 'pipe-w-3'] },
      { id: 'pipe-w-2', name: '焊接区水管', position: { x: -20, y: 3, z: -25 }, type: 'water', status: 'normal', connections: ['pipe-w-1', 'pipe-w-4'] },
      { id: 'pipe-w-3', name: '加工区水管', position: { x: 10, y: 3, z: -25 }, type: 'water', status: 'abnormal', connections: ['pipe-w-1', 'pipe-w-5'] },
      { id: 'pipe-w-4', name: '装配区水管', position: { x: -10, y: 3, z: 25 }, type: 'water', status: 'normal', connections: ['pipe-w-2'] },
      { id: 'pipe-w-5', name: '仓储区水管', position: { x: 35, y: 3, z: 20 }, type: 'water', status: 'normal', connections: ['pipe-w-3'] },
      { id: 'pipe-e-1', name: '主配电柜', position: { x: -45, y: 5, z: 25 }, type: 'electric', status: 'normal', connections: ['pipe-e-2', 'pipe-e-3'] },
      { id: 'pipe-e-2', name: '生产线电柜', position: { x: -5, y: 5, z: 25 }, type: 'electric', status: 'normal', connections: ['pipe-e-1', 'pipe-e-4'] },
      { id: 'pipe-e-3', name: '仓储电柜', position: { x: 35, y: 5, z: 25 }, type: 'electric', status: 'normal', connections: ['pipe-e-1'] },
      { id: 'pipe-e-4', name: '加工区电柜', position: { x: 10, y: 5, z: -25 }, type: 'electric', status: 'normal', connections: ['pipe-e-2'] },
    ]
    set({ pipeNodes: nodes })
  },
  highlightPipePath: (nodeId) => {
    // 管线联动高亮逻辑
  },

  showLabels: true,
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),

  showPipes: true,
  togglePipes: () => set((state) => ({ showPipes: !state.showPipes })),

  showCameras: true,
  toggleCameras: () => set((state) => ({ showCameras: !state.showCameras })),

  animationFrame: 0,
  setAnimationFrame: (frame) => set({ animationFrame: frame }),
}))
