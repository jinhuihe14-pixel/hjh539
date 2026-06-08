import { create } from 'zustand'
import type { Device, DeviceStatus } from '../types'

interface DeviceStore {
  devices: Map<string, Device>
  selectedDeviceId: string | null
  deviceList: Device[]
  
  initMockData: () => void
  selectDevice: (id: string | null) => void
  updateDeviceStatus: (id: string, status: DeviceStatus) => void
  updateDeviceParameters: (id: string, params: { name: string; value: number }[]) => void
  getDevicesByStatus: (status: DeviceStatus) => Device[]
  getDeviceList: () => Device[]
  startDataSimulation: () => void
  stopDataSimulation: () => void
}

let simulationInterval: number | null = null

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: new Map(),
  selectedDeviceId: null,
  deviceList: [],

  initMockData: () => {
    const devices = new Map<string, Device>()
    
    const robotData = [
      { id: 'robot-001', name: '焊接机器人A1', type: 'robot', pos: [-20, 0, -15] },
      { id: 'robot-002', name: '焊接机器人A2', type: 'robot', pos: [-20, 0, -5] },
      { id: 'robot-003', name: '装配机器人B1', type: 'robot', pos: [-20, 0, 5] },
      { id: 'robot-004', name: '装配机器人B2', type: 'robot', pos: [-20, 0, 15] },
      { id: 'robot-005', name: '搬运机器人C1', type: 'robot', pos: [0, 0, -15] },
      { id: 'robot-006', name: '搬运机器人C2', type: 'robot', pos: [0, 0, 15] },
    ]

    const machineData = [
      { id: 'cnc-001', name: 'CNC加工中心M1', type: 'cnc', pos: [10, 0, -20] },
      { id: 'cnc-002', name: 'CNC加工中心M2', type: 'cnc', pos: [10, 0, -10] },
      { id: 'cnc-003', name: 'CNC加工中心M3', type: 'cnc', pos: [10, 0, 0] },
      { id: 'cnc-004', name: 'CNC加工中心M4', type: 'cnc', pos: [10, 0, 10] },
      { id: 'cnc-005', name: 'CNC加工中心M5', type: 'cnc', pos: [10, 0, 20] },
    ]

    const conveyorData = [
      { id: 'conv-001', name: '主传输线1', type: 'conveyor', pos: [-5, 0, 0] },
      { id: 'conv-002', name: '分拣传输线', type: 'conveyor', pos: [25, 0, 0] },
    ]

    const allDevices = [...robotData, ...machineData, ...conveyorData]
    const statuses: DeviceStatus[] = ['normal', 'normal', 'normal', 'normal', 'standby', 'fault']

    allDevices.forEach((device, index) => {
      const status = device.type === 'conveyor' ? 'normal' : statuses[index % statuses.length]
      const parameters = generateDeviceParameters(device.type, status)
      
      devices.set(device.id, {
        id: device.id,
        name: device.name,
        type: device.type,
        status,
        position: { x: device.pos[0], y: device.pos[1], z: device.pos[2] },
        parameters,
        historyData: generateHistoryData(device.type),
        lastUpdate: Date.now(),
        description: `工业级${device.type === 'robot' ? '机器人' : device.type === 'cnc' ? '加工中心' : '传输设备'}`,
      })
    })

    const deviceList = Array.from(devices.values())

    set({ devices, deviceList })
  },

  selectDevice: (id) => set({ selectedDeviceId: id }),

  updateDeviceStatus: (id, status) => {
    const { devices } = get()
    const device = devices.get(id)
    if (device) {
      const updated = new Map(devices)
      updated.set(id, { ...device, status, lastUpdate: Date.now() })
      const deviceList = Array.from(updated.values())
      set({ devices: updated, deviceList })
    }
  },

  updateDeviceParameters: (id, params) => {
    const { devices } = get()
    const device = devices.get(id)
    if (device) {
      const updatedParams = device.parameters.map(p => {
        const update = params.find(up => up.name === p.name)
        return update ? { ...p, value: update.value } : p
      })
      const updated = new Map(devices)
      updated.set(id, { ...device, parameters: updatedParams, lastUpdate: Date.now() })
      const deviceList = Array.from(updated.values())
      set({ devices: updated, deviceList })
    }
  },

  getDevicesByStatus: (status) => {
    const { devices } = get()
    return Array.from(devices.values()).filter(d => d.status === status)
  },

  getDeviceList: () => {
    return get().deviceList
  },

  startDataSimulation: () => {
    if (simulationInterval) return
    
    simulationInterval = window.setInterval(() => {
      const { devices } = get()
      const updated = new Map(devices)
      
      updated.forEach((device, id) => {
        if (device.status !== 'fault' && device.status !== 'maintenance') {
          const newParams = device.parameters.map(p => {
            const variation = (Math.random() - 0.5) * (p.max && p.min ? (p.max - p.min) * 0.05 : 2)
            let newValue = p.value + variation
            if (p.min !== undefined) newValue = Math.max(p.min, newValue)
            if (p.max !== undefined) newValue = Math.min(p.max, newValue)
            return { ...p, value: Math.round(newValue * 100) / 100 }
          })
          
          const historyData = device.historyData ? [...device.historyData.slice(-49), {
            time: new Date().toLocaleTimeString(),
            value: newParams[0]?.value || 0,
          }] : undefined
          
          updated.set(id, { ...device, parameters: newParams, historyData, lastUpdate: Date.now() })
        }
      })
      
      const deviceList = Array.from(updated.values())
      set({ devices: updated, deviceList })
    }, 2000)
  },

  stopDataSimulation: () => {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      simulationInterval = null
    }
  },
}))

function generateDeviceParameters(type: string, status: DeviceStatus) {
  if (type === 'robot') {
    return [
      { name: '负载率', value: status === 'normal' ? 65 + Math.random() * 20 : status === 'standby' ? 5 : 0, unit: '%', min: 0, max: 100 },
      { name: '温度', value: status === 'fault' ? 85 : 45 + Math.random() * 15, unit: '°C', min: 0, max: 120 },
      { name: '运行速度', value: status === 'normal' ? 80 + Math.random() * 15 : 0, unit: '%', min: 0, max: 100 },
      { name: '电压', value: 380 + Math.random() * 10 - 5, unit: 'V', min: 360, max: 420 },
    ]
  }
  if (type === 'cnc') {
    return [
      { name: '主轴转速', value: status === 'normal' ? 3000 + Math.random() * 2000 : 0, unit: 'rpm', min: 0, max: 8000 },
      { name: '进给速度', value: status === 'normal' ? 500 + Math.random() * 300 : 0, unit: 'mm/min', min: 0, max: 2000 },
      { name: '温度', value: status === 'fault' ? 95 : 50 + Math.random() * 20, unit: '°C', min: 0, max: 150 },
      { name: '功率', value: status === 'normal' ? 15 + Math.random() * 5 : 2, unit: 'kW', min: 0, max: 30 },
    ]
  }
  return [
    { name: '运行速度', value: status === 'normal' ? 1.5 + Math.random() * 0.5 : 0, unit: 'm/s', min: 0, max: 3 },
    { name: '负载', value: status === 'normal' ? 60 + Math.random() * 20 : 0, unit: '%', min: 0, max: 100 },
    { name: '温度', value: 35 + Math.random() * 10, unit: '°C', min: 0, max: 80 },
  ]
}

function generateHistoryData(type: string) {
  const data = []
  const now = new Date()
  for (let i = 49; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000)
    const base = type === 'robot' ? 70 : type === 'cnc' ? 4000 : 1.5
    data.push({
      time: time.toLocaleTimeString().slice(0, 5),
      value: base + (Math.random() - 0.5) * base * 0.2,
    })
  }
  return data
}
