import { create } from 'zustand'
import type { MaintenanceOrder, MaintenanceStatus, MaintenancePriority, MaintenanceRecord, MaintenancePart } from '../types'

interface MaintenanceStore {
  orders: Map<string, MaintenanceOrder>
  selectedOrderId: string | null
  orderList: MaintenanceOrder[]
  
  initMockData: () => void
  selectOrder: (id: string | null) => void
  createOrder: (deviceId: string, deviceName: string, title: string, description: string, priority: MaintenancePriority) => MaintenanceOrder
  updateOrderStatus: (id: string, status: MaintenanceStatus, technician?: string) => void
  updateOrderProgress: (id: string, progress: number) => void
  assignOrder: (id: string, technician: string) => void
  completeOrder: (id: string, record: Omit<MaintenanceRecord, 'id' | 'date'>) => void
  getOrdersByDevice: (deviceId: string) => MaintenanceOrder[]
  getOrdersByStatus: (status: MaintenanceStatus) => MaintenanceOrder[]
  getOrderById: (id: string) => MaintenanceOrder | undefined
  addPartToOrder: (orderId: string, part: MaintenancePart) => void
  removePartFromOrder: (orderId: string, partId: string) => void
}

let orderIdCounter = 1000

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  orders: new Map(),
  selectedOrderId: null,
  orderList: [],

  initMockData: () => {
    const orders = new Map<string, MaintenanceOrder>()
    
    const mockOrders: MaintenanceOrder[] = [
      {
        id: 'mo-1001',
        deviceId: 'robot-001',
        deviceName: '焊接机器人A1',
        title: '定期维护保养',
        description: '机器人运行500小时后定期保养，检查关节润滑、皮带张紧度',
        status: 'pending',
        priority: 'medium',
        createTime: new Date(Date.now() - 3600000).toISOString(),
        parts: [],
        history: [
          {
            id: 'mr-001',
            date: new Date(Date.now() - 86400000 * 30).toISOString(),
            type: '定期保养',
            description: '月度保养，更换润滑油',
            parts: [
              { id: 'p-001', name: '工业润滑油', quantity: 2, unit: 'L' },
              { id: 'p-002', name: '密封圈套件', quantity: 1, unit: '套' },
            ],
            technician: '张工',
            duration: 120,
          },
        ],
        progress: 0,
      },
      {
        id: 'mo-1002',
        deviceId: 'cnc-003',
        deviceName: 'CNC加工中心M3',
        title: '主轴异响故障维修',
        description: '主轴运行时出现异常噪音，疑似轴承磨损',
        status: 'inProgress',
        priority: 'high',
        createTime: new Date(Date.now() - 7200000).toISOString(),
        assignTime: new Date(Date.now() - 5400000).toISOString(),
        technician: '李工',
        parts: [
          { id: 'p-003', name: '主轴轴承', quantity: 2, unit: '个', price: 1200 },
          { id: 'p-004', name: '锁紧螺母', quantity: 4, unit: '个', price: 50 },
        ],
        history: [
          {
            id: 'mr-002',
            date: new Date(Date.now() - 86400000 * 60).toISOString(),
            type: '故障维修',
            description: '伺服驱动器故障，更换驱动板',
            parts: [
              { id: 'p-005', name: '伺服驱动板', quantity: 1, unit: '块', price: 3500 },
            ],
            technician: '王工',
            duration: 180,
          },
        ],
        progress: 45,
      },
      {
        id: 'mo-1003',
        deviceId: 'robot-005',
        deviceName: '搬运机器人C1',
        title: '夹爪更换',
        description: '夹爪磨损严重，需要更换新的夹爪组件',
        status: 'completed',
        priority: 'low',
        createTime: new Date(Date.now() - 86400000 * 3).toISOString(),
        assignTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        completeTime: new Date(Date.now() - 86400000).toISOString(),
        technician: '赵工',
        parts: [
          { id: 'p-006', name: '夹爪组件', quantity: 1, unit: '套', price: 2800 },
        ],
        history: [
          {
            id: 'mr-003',
            date: new Date(Date.now() - 86400000).toISOString(),
            type: '配件更换',
            description: '更换磨损夹爪组件',
            parts: [
              { id: 'p-006', name: '夹爪组件', quantity: 1, unit: '套', price: 2800 },
            ],
            technician: '赵工',
            duration: 90,
          },
        ],
        progress: 100,
      },
      {
        id: 'mo-1004',
        deviceId: 'cnc-001',
        deviceName: 'CNC加工中心M1',
        title: '紧急故障抢修',
        description: '机床突然停机，报警代码E-017，主轴过载',
        status: 'pending',
        priority: 'urgent',
        createTime: new Date(Date.now() - 1800000).toISOString(),
        parts: [],
        history: [],
        progress: 0,
      },
      {
        id: 'mo-1005',
        deviceId: 'conv-001',
        deviceName: '主传输线1',
        title: '传送带调整',
        description: '传送带跑偏，需要调整张紧装置',
        status: 'inProgress',
        priority: 'medium',
        createTime: new Date(Date.now() - 14400000).toISOString(),
        assignTime: new Date(Date.now() - 10800000).toISOString(),
        technician: '陈工',
        parts: [],
        history: [
          {
            id: 'mr-004',
            date: new Date(Date.now() - 86400000 * 90).toISOString(),
            type: '定期检查',
            description: '季度巡检',
            parts: [],
            technician: '陈工',
            duration: 60,
          },
        ],
        progress: 70,
      },
    ]

    mockOrders.forEach(order => {
      orders.set(order.id, order)
    })

    const orderList = Array.from(orders.values())
    set({ orders, orderList })
  },

  selectOrder: (id) => set({ selectedOrderId: id }),

  createOrder: (deviceId, deviceName, title, description, priority) => {
    const newOrder: MaintenanceOrder = {
      id: `mo-${++orderIdCounter}`,
      deviceId,
      deviceName,
      title,
      description,
      status: 'pending',
      priority,
      createTime: new Date().toISOString(),
      parts: [],
      history: [],
      progress: 0,
    }

    const { orders } = get()
    const updated = new Map(orders)
    updated.set(newOrder.id, newOrder)
    const orderList = Array.from(updated.values())
    set({ orders: updated, orderList })

    return newOrder
  },

  updateOrderStatus: (id, status, technician) => {
    const { orders } = get()
    const order = orders.get(id)
    if (order) {
      const updated = new Map(orders)
      const now = new Date().toISOString()
      updated.set(id, {
        ...order,
        status,
        technician: technician || order.technician,
        assignTime: status === 'inProgress' && !order.assignTime ? now : order.assignTime,
        completeTime: status === 'completed' ? now : order.completeTime,
        progress: status === 'completed' ? 100 : order.progress,
      })
      const orderList = Array.from(updated.values())
      set({ orders: updated, orderList })
    }
  },

  updateOrderProgress: (id, progress) => {
    const { orders } = get()
    const order = orders.get(id)
    if (order) {
      const updated = new Map(orders)
      updated.set(id, { ...order, progress: Math.max(0, Math.min(100, progress)) })
      const orderList = Array.from(updated.values())
      set({ orders: updated, orderList })
    }
  },

  assignOrder: (id, technician) => {
    const { orders } = get()
    const order = orders.get(id)
    if (order) {
      const updated = new Map(orders)
      updated.set(id, {
        ...order,
        technician,
        status: 'inProgress',
        assignTime: new Date().toISOString(),
      })
      const orderList = Array.from(updated.values())
      set({ orders: updated, orderList })
    }
  },

  completeOrder: (id, record) => {
    const { orders } = get()
    const order = orders.get(id)
    if (order) {
      const newRecord: MaintenanceRecord = {
        ...record,
        id: `mr-${Date.now()}`,
        date: new Date().toISOString(),
      }
      const updated = new Map(orders)
      updated.set(id, {
        ...order,
        status: 'completed',
        progress: 100,
        completeTime: new Date().toISOString(),
        history: [...order.history, newRecord],
      })
      const orderList = Array.from(updated.values())
      set({ orders: updated, orderList })
    }
  },

  getOrdersByDevice: (deviceId) => {
    const { orders } = get()
    return Array.from(orders.values()).filter(o => o.deviceId === deviceId)
  },

  getOrdersByStatus: (status) => {
    const { orders } = get()
    return Array.from(orders.values()).filter(o => o.status === status)
  },

  getOrderById: (id) => {
    return get().orders.get(id)
  },

  addPartToOrder: (orderId, part) => {
    const { orders } = get()
    const order = orders.get(orderId)
    if (order) {
      const updated = new Map(orders)
      updated.set(orderId, {
        ...order,
        parts: [...order.parts, part],
      })
      const orderList = Array.from(updated.values())
      set({ orders: updated, orderList })
    }
  },

  removePartFromOrder: (orderId, partId) => {
    const { orders } = get()
    const order = orders.get(orderId)
    if (order) {
      const updated = new Map(orders)
      updated.set(orderId, {
        ...order,
        parts: order.parts.filter(p => p.id !== partId),
      })
      const orderList = Array.from(updated.values())
      set({ orders: updated, orderList })
    }
  },
}))
