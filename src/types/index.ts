export type DeviceStatus = 'normal' | 'standby' | 'fault' | 'maintenance'

export type MaintenanceStatus = 'pending' | 'inProgress' | 'completed'

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'

export interface DeviceParameter {
  name: string
  value: number
  unit: string
  min?: number
  max?: number
}

export interface Device {
  id: string
  name: string
  type: string
  status: DeviceStatus
  position: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  parameters: DeviceParameter[]
  historyData?: { time: string; value: number }[]
  lastUpdate: number
  description?: string
  maintenanceStatus?: MaintenanceStatus
}

export interface ProductionLine {
  id: string
  name: string
  devices: string[]
  status: DeviceStatus
  throughput: number
  target: number
}

export interface WarehouseSlot {
  id: string
  row: number
  column: number
  level: number
  status: 'occupied' | 'empty' | 'pending'
  materialId?: string
  materialName?: string
  quantity?: number
  batch?: string
}

export interface Camera {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  status: 'online' | 'offline'
  type: 'fixed' | 'ptz'
}

export interface PipeNode {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  type: 'water' | 'gas' | 'electric' | 'signal'
  status: 'normal' | 'abnormal'
  connections: string[]
}

export type ViewMode = 'orbit' | 'firstPerson' | 'fly' | 'inspection' | 'patrol'

export interface InspectionPoint {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
  stayDuration?: number
}

export interface MaintenancePart {
  id: string
  name: string
  quantity: number
  unit: string
  price?: number
}

export interface MaintenanceRecord {
  id: string
  date: string
  type: string
  description: string
  parts: MaintenancePart[]
  technician: string
  duration: number
}

export interface MaintenanceOrder {
  id: string
  deviceId: string
  deviceName: string
  title: string
  description: string
  status: MaintenanceStatus
  priority: MaintenancePriority
  createTime: string
  assignTime?: string
  completeTime?: string
  technician?: string
  parts: MaintenancePart[]
  history: MaintenanceRecord[]
  progress: number
}

export interface RecordedFrame {
  timestamp: number
  cameraPosition: { x: number; y: number; z: number }
  cameraTarget: { x: number; y: number; z: number }
  deviceStates: {
    deviceId: string
    status: DeviceStatus
    parameters: { name: string; value: number }[]
  }[]
}

export interface Recording {
  id: string
  name: string
  description?: string
  startTime: number
  endTime?: number
  duration: number
  targetType: 'line' | 'device' | 'area'
  targetId?: string
  frames: RecordedFrame[]
  frameCount: number
  size: number
}

export interface InspectionRoute {
  id: string
  name: string
  description?: string
  group: string
  points: InspectionPoint[]
  enabled: boolean
  createdAt: string
  updatedAt: string
  permissions: string[]
  totalDuration?: number
}

export interface InspectionRecord {
  id: string
  routeId: string
  routeName: string
  startTime: string
  endTime?: string
  status: 'inProgress' | 'completed' | 'aborted'
  pointResults: {
    pointId: string
    pointName: string
    visited: boolean
    visitTime?: string
    stayDuration: number
    abnormal: boolean
    remark?: string
  }[]
  operator?: string
  abnormalCount: number
}

export type AnnotationType = 'note' | 'issue' | 'warning' | 'info'

export interface Annotation {
  id: string
  position: { x: number; y: number; z: number }
  type: AnnotationType
  title: string
  content: string
  author: string
  createdAt: string
  updatedAt: string
  deviceId?: string
  pipeId?: string
  resolved?: boolean
}

export interface NetworkStatus {
  isOnline: boolean
  lastOnlineTime: number
  reconnectAttempts: number
  pendingData: { time: number; data: any }[]
}
