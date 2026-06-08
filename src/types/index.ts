export type DeviceStatus = 'normal' | 'standby' | 'fault' | 'maintenance'

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

export type ViewMode = 'orbit' | 'firstPerson' | 'fly' | 'inspection'

export interface InspectionPoint {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
}
