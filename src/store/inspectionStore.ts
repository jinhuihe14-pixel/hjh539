import { create } from 'zustand'
import type { InspectionRoute, InspectionRecord, InspectionPoint } from '../types'

interface InspectionStore {
  routes: Map<string, InspectionRoute>
  routeList: InspectionRoute[]
  selectedRouteId: string | null
  isPatrolling: boolean
  currentPatrolPointIndex: number
  patrolStartTime: number
  currentRecordId: string | null
  records: InspectionRecord[]
  isEditingRoute: boolean
  editingRouteId: string | null
  tempPoints: InspectionPoint[]

  initMockData: () => void
  selectRoute: (id: string | null) => void
  createRoute: (name: string, group: string, description?: string) => InspectionRoute
  updateRoute: (id: string, updates: Partial<InspectionRoute>) => void
  deleteRoute: (id: string) => void
  duplicateRoute: (id: string) => void
  toggleRouteEnabled: (id: string) => void
  getRoutesByGroup: (group: string) => InspectionRoute[]

  startEditingRoute: (id: string) => void
  addPointToRoute: (point: InspectionPoint) => void
  removePointFromRoute: (pointId: string) => void
  updatePointInRoute: (pointId: string, updates: Partial<InspectionPoint>) => void
  reorderPoints: (fromIndex: number, toIndex: number) => void
  saveRouteEdit: () => void
  cancelRouteEdit: () => void

  startPatrol: (routeId: string) => void
  advancePatrolPoint: () => boolean
  getCurrentPatrolPoint: () => InspectionPoint | null
  completePatrol: (abnormal?: boolean, remark?: string) => void
  abortPatrol: () => void
  markPointAbnormal: (pointId: string, remark?: string) => void

  getRecords: () => InspectionRecord[]
  getRecordById: (id: string) => InspectionRecord | undefined
  getRecordsByRoute: (routeId: string) => InspectionRecord[]
}

let routeIdCounter = 3000
let recordIdCounter = 4000
let pointIdCounter = 5000

export const useInspectionStore = create<InspectionStore>((set, get) => ({
  routes: new Map(),
  routeList: [],
  selectedRouteId: null,
  isPatrolling: false,
  currentPatrolPointIndex: 0,
  patrolStartTime: 0,
  currentRecordId: null,
  records: [],
  isEditingRoute: false,
  editingRouteId: null,
  tempPoints: [],

  initMockData: () => {
    const routes = new Map<string, InspectionRoute>()

    const mockRoutes: InspectionRoute[] = [
      {
        id: 'route-3001',
        name: '日常巡检路线A',
        description: '白班日常设备巡检，覆盖主要生产区域',
        group: '生产班组',
        enabled: true,
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        permissions: ['admin', 'production'],
        totalDuration: 1800,
        points: [
          { id: 'pt-5001', name: '入口检查点', position: { x: -40, y: 15, z: 0 }, target: { x: 0, y: 2, z: 0 }, stayDuration: 30 },
          { id: 'pt-5002', name: '焊接区巡检', position: { x: -20, y: 12, z: -25 }, target: { x: -20, y: 2, z: -10 }, stayDuration: 60 },
          { id: 'pt-5003', name: '加工区巡检', position: { x: 15, y: 15, z: -25 }, target: { x: 10, y: 2, z: -10 }, stayDuration: 60 },
          { id: 'pt-5004', name: '仓储区巡检', position: { x: 35, y: 20, z: 15 }, target: { x: 35, y: 5, z: 15 }, stayDuration: 45 },
          { id: 'pt-5005', name: '装配区巡检', position: { x: -10, y: 12, z: 25 }, target: { x: -10, y: 2, z: 10 }, stayDuration: 45 },
        ],
      },
      {
        id: 'route-3002',
        name: '安全消防巡检',
        description: '消防设施、安全通道专项检查',
        group: '安全班组',
        enabled: true,
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        permissions: ['admin', 'safety'],
        totalDuration: 2400,
        points: [
          { id: 'pt-5006', name: '东侧消防栓', position: { x: 45, y: 8, z: -20 }, target: { x: 40, y: 2, z: -20 }, stayDuration: 30 },
          { id: 'pt-5007', name: '西侧安全出口', position: { x: -45, y: 8, z: 20 }, target: { x: -40, y: 2, z: 20 }, stayDuration: 30 },
          { id: 'pt-5008', name: '中央灭火器区', position: { x: 0, y: 10, z: 0 }, target: { x: 0, y: 2, z: 0 }, stayDuration: 45 },
        ],
      },
      {
        id: 'route-3003',
        name: '夜班快速巡检',
        description: '夜班精简巡检路线',
        group: '生产班组',
        enabled: false,
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        permissions: ['admin', 'production_night'],
        totalDuration: 900,
        points: [
          { id: 'pt-5009', name: '入口', position: { x: -35, y: 12, z: 0 }, target: { x: 0, y: 2, z: 0 }, stayDuration: 20 },
          { id: 'pt-5010', name: '核心设备区', position: { x: 0, y: 15, z: 0 }, target: { x: 0, y: 2, z: 0 }, stayDuration: 60 },
        ],
      },
      {
        id: 'route-3004',
        name: '设备维护专项巡检',
        description: '设备部门深度巡检路线',
        group: '维护班组',
        enabled: true,
        createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        permissions: ['admin', 'maintenance'],
        totalDuration: 3600,
        points: [
          { id: 'pt-5011', name: '机器人组检查', position: { x: -20, y: 10, z: 0 }, target: { x: -20, y: 2, z: 0 }, stayDuration: 120 },
          { id: 'pt-5012', name: 'CNC加工中心检查', position: { x: 10, y: 10, z: 0 }, target: { x: 10, y: 2, z: 0 }, stayDuration: 180 },
          { id: 'pt-5013', name: '传输系统检查', position: { x: -5, y: 12, z: 0 }, target: { x: -5, y: 2, z: 0 }, stayDuration: 90 },
        ],
      },
    ]

    mockRoutes.forEach(route => {
      routes.set(route.id, route)
    })

    const mockRecords: InspectionRecord[] = [
      {
        id: 'record-4001',
        routeId: 'route-3001',
        routeName: '日常巡检路线A',
        startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        endTime: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
        status: 'completed',
        operator: '张工',
        abnormalCount: 0,
        pointResults: [
          { pointId: 'pt-5001', pointName: '入口检查点', visited: true, visitTime: new Date(Date.now() - 86400000 * 2).toISOString(), stayDuration: 35, abnormal: false },
          { pointId: 'pt-5002', pointName: '焊接区巡检', visited: true, visitTime: new Date(Date.now() - 86400000 * 2 + 300000).toISOString(), stayDuration: 65, abnormal: false },
          { pointId: 'pt-5003', pointName: '加工区巡检', visited: true, visitTime: new Date(Date.now() - 86400000 * 2 + 900000).toISOString(), stayDuration: 70, abnormal: false },
          { pointId: 'pt-5004', pointName: '仓储区巡检', visited: true, visitTime: new Date(Date.now() - 86400000 * 2 + 1500000).toISOString(), stayDuration: 50, abnormal: false },
          { pointId: 'pt-5005', pointName: '装配区巡检', visited: true, visitTime: new Date(Date.now() - 86400000 * 2 + 1700000).toISOString(), stayDuration: 48, abnormal: false },
        ],
      },
      {
        id: 'record-4002',
        routeId: 'route-3002',
        routeName: '安全消防巡检',
        startTime: new Date(Date.now() - 86400000).toISOString(),
        endTime: new Date(Date.now() - 86400000 + 2100000).toISOString(),
        status: 'completed',
        operator: '李工',
        abnormalCount: 1,
        pointResults: [
          { pointId: 'pt-5006', pointName: '东侧消防栓', visited: true, visitTime: new Date(Date.now() - 86400000).toISOString(), stayDuration: 32, abnormal: false },
          { pointId: 'pt-5007', pointName: '西侧安全出口', visited: true, visitTime: new Date(Date.now() - 86400000 + 700000).toISOString(), stayDuration: 28, abnormal: false },
          { pointId: 'pt-5008', pointName: '中央灭火器区', visited: true, visitTime: new Date(Date.now() - 86400000 + 1400000).toISOString(), stayDuration: 55, abnormal: true, remark: '2号灭火器压力不足' },
        ],
      },
    ]

    set({
      routes,
      routeList: Array.from(routes.values()),
      records: mockRecords,
    })
  },

  selectRoute: (id) => set({ selectedRouteId: id }),

  createRoute: (name, group, description) => {
    const newRoute: InspectionRoute = {
      id: `route-${++routeIdCounter}`,
      name,
      description,
      group,
      points: [],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      permissions: ['admin'],
      totalDuration: 0,
    }

    const { routes } = get()
    const updated = new Map(routes)
    updated.set(newRoute.id, newRoute)
    set({ routes: updated, routeList: Array.from(updated.values()) })

    return newRoute
  },

  updateRoute: (id, updates) => {
    const { routes } = get()
    const route = routes.get(id)
    if (route) {
      const updated = new Map(routes)
      const totalDuration = updates.points
        ? updates.points.reduce((sum, p) => sum + (p.stayDuration || 30), 0)
        : route.totalDuration
      updated.set(id, { ...route, ...updates, updatedAt: new Date().toISOString(), totalDuration })
      set({ routes: updated, routeList: Array.from(updated.values()) })
    }
  },

  deleteRoute: (id) => {
    const { routes } = get()
    const updated = new Map(routes)
    updated.delete(id)
    set({
      routes: updated,
      routeList: Array.from(updated.values()),
      selectedRouteId: get().selectedRouteId === id ? null : get().selectedRouteId,
    })
  },

  duplicateRoute: (id) => {
    const { routes } = get()
    const route = routes.get(id)
    if (route) {
      const newRoute: InspectionRoute = {
        ...route,
        id: `route-${++routeIdCounter}`,
        name: `${route.name} (副本)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        points: route.points.map(p => ({ ...p, id: `pt-${++pointIdCounter}` })),
      }
      const updated = new Map(routes)
      updated.set(newRoute.id, newRoute)
      set({ routes: updated, routeList: Array.from(updated.values()) })
    }
  },

  toggleRouteEnabled: (id) => {
    const { routes } = get()
    const route = routes.get(id)
    if (route) {
      const updated = new Map(routes)
      updated.set(id, { ...route, enabled: !route.enabled, updatedAt: new Date().toISOString() })
      set({ routes: updated, routeList: Array.from(updated.values()) })
    }
  },

  getRoutesByGroup: (group) => {
    return get().routeList.filter(r => r.group === group)
  },

  startEditingRoute: (id) => {
    const { routes } = get()
    const route = routes.get(id)
    if (route) {
      set({
        isEditingRoute: true,
        editingRouteId: id,
        tempPoints: JSON.parse(JSON.stringify(route.points)),
      })
    }
  },

  addPointToRoute: (point) => {
    set((state) => ({
      tempPoints: [...state.tempPoints, point],
    }))
  },

  removePointFromRoute: (pointId) => {
    set((state) => ({
      tempPoints: state.tempPoints.filter(p => p.id !== pointId),
    }))
  },

  updatePointInRoute: (pointId, updates) => {
    set((state) => ({
      tempPoints: state.tempPoints.map(p =>
        p.id === pointId ? { ...p, ...updates } : p
      ),
    }))
  },

  reorderPoints: (fromIndex, toIndex) => {
    set((state) => {
      const points = [...state.tempPoints]
      const [removed] = points.splice(fromIndex, 1)
      points.splice(toIndex, 0, removed)
      return { tempPoints: points }
    })
  },

  saveRouteEdit: () => {
    const { editingRouteId, tempPoints } = get()
    if (editingRouteId) {
      get().updateRoute(editingRouteId, { points: tempPoints })
    }
    set({
      isEditingRoute: false,
      editingRouteId: null,
      tempPoints: [],
    })
  },

  cancelRouteEdit: () => {
    set({
      isEditingRoute: false,
      editingRouteId: null,
      tempPoints: [],
    })
  },

  startPatrol: (routeId) => {
    const { routes } = get()
    const route = routes.get(routeId)
    if (!route || route.points.length === 0) return

    const pointResults = route.points.map(p => ({
      pointId: p.id,
      pointName: p.name,
      visited: false,
      stayDuration: p.stayDuration || 30,
      abnormal: false,
    }))

    const newRecord: InspectionRecord = {
      id: `record-${++recordIdCounter}`,
      routeId,
      routeName: route.name,
      startTime: new Date().toISOString(),
      status: 'inProgress',
      pointResults,
      abnormalCount: 0,
    }

    set((state) => ({
      records: [...state.records, newRecord],
      isPatrolling: true,
      currentPatrolPointIndex: 0,
      patrolStartTime: Date.now(),
      currentRecordId: newRecord.id,
      selectedRouteId: routeId,
    }))
  },

  advancePatrolPoint: () => {
    const { currentPatrolPointIndex, selectedRouteId, routes, currentRecordId, records } = get()
    const route = routes.get(selectedRouteId!)
    if (!route) return false

    const nextIndex = currentPatrolPointIndex + 1
    if (nextIndex >= route.points.length) {
      get().completePatrol()
      return false
    }

    const updatedRecords = records.map(r => {
      if (r.id === currentRecordId) {
        const updatedResults = r.pointResults.map((pr, idx) => {
          if (idx === currentPatrolPointIndex) {
            return { ...pr, visited: true, visitTime: new Date().toISOString() }
          }
          return pr
        })
        return { ...r, pointResults: updatedResults }
      }
      return r
    })

    set({
      currentPatrolPointIndex: nextIndex,
      records: updatedRecords,
    })

    return true
  },

  getCurrentPatrolPoint: () => {
    const { selectedRouteId, routes, currentPatrolPointIndex } = get()
    const route = routes.get(selectedRouteId!)
    return route?.points[currentPatrolPointIndex] || null
  },

  completePatrol: (abnormal = false, remark = '') => {
    const { currentRecordId, records, currentPatrolPointIndex } = get()

    const updatedRecords = records.map(r => {
      if (r.id === currentRecordId) {
        const abnormalCount = r.pointResults.filter(pr => pr.abnormal).length
        return {
          ...r,
          status: 'completed' as const,
          endTime: new Date().toISOString(),
          abnormalCount,
          pointResults: r.pointResults.map((pr, idx) =>
            idx <= currentPatrolPointIndex && !pr.visited
              ? { ...pr, visited: true, visitTime: new Date().toISOString() }
              : pr
          ),
        }
      }
      return r
    })

    set({
      records: updatedRecords,
      isPatrolling: false,
      currentPatrolPointIndex: 0,
      patrolStartTime: 0,
      currentRecordId: null,
    })
  },

  abortPatrol: () => {
    const { currentRecordId, records } = get()

    const updatedRecords = records.map(r => {
      if (r.id === currentRecordId) {
        return { ...r, status: 'aborted' as const, endTime: new Date().toISOString() }
      }
      return r
    })

    set({
      records: updatedRecords,
      isPatrolling: false,
      currentPatrolPointIndex: 0,
      patrolStartTime: 0,
      currentRecordId: null,
    })
  },

  markPointAbnormal: (pointId, remark) => {
    const { currentRecordId, records } = get()

    const updatedRecords = records.map(r => {
      if (r.id === currentRecordId) {
        const updatedResults = r.pointResults.map(pr =>
          pr.pointId === pointId
            ? { ...pr, abnormal: true, remark: remark || pr.remark }
            : pr
        )
        return {
          ...r,
          pointResults: updatedResults,
          abnormalCount: updatedResults.filter(pr => pr.abnormal).length,
        }
      }
      return r
    })

    set({ records: updatedRecords })
  },

  getRecords: () => get().records,

  getRecordById: (id) => get().records.find(r => r.id === id),

  getRecordsByRoute: (routeId) => get().records.filter(r => r.routeId === routeId),
}))
