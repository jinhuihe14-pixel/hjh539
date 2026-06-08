import * as THREE from 'three'
import { SceneEngine } from './SceneEngine'
import { createFactoryBuilding } from './BuildingFactory'
import { createRobot, createCNCMachine, createConveyor, updateDeviceStatus } from './DeviceFactory'
import { createWarehouse } from './WarehouseFactory'
import { createPipeSystem, createCameras, createSafetyDevices } from './SecurityFactory'
import type { Device, WarehouseSlot, Camera, PipeNode, MaintenanceStatus, Annotation, InspectionPoint, InspectionRoute } from '../types'

const MAINTENANCE_COLORS: Record<MaintenanceStatus, number> = {
  pending: 0xff9800,
  inProgress: 0x2196f3,
  completed: 0x4caf50,
}

const ANNOTATION_COLORS = {
  note: 0x2196f3,
  issue: 0xf44336,
  warning: 0xff9800,
  info: 0x9c27b0,
}

export class SceneManager {
  private engine: SceneEngine
  private building: THREE.Group | null = null
  private devices: Map<string, THREE.Group> = new Map()
  private warehouse: THREE.Group | null = null
  private pipeSystem: THREE.Group | null = null
  private cameraSystem: THREE.Group | null = null
  private safetySystem: THREE.Group | null = null
  private labels: THREE.Group[] = []
  
  private maintenanceMarkers: Map<string, THREE.Group> = new Map()
  private annotations: Map<string, THREE.Group> = new Map()
  private annotationGroup: THREE.Group | null = null
  private inspectionRouteGroup: THREE.Group | null = null
  private inspectionPoints: Map<string, THREE.Group> = new Map()
  private inspectionLines: THREE.Line | null = null
  
  private conveyors: THREE.Group[] = []
  private materials: THREE.Mesh[] = []
  private simulationTime: number = 0

  constructor(engine: SceneEngine) {
    this.engine = engine
    this.annotationGroup = new THREE.Group()
    this.annotationGroup.name = 'annotations'
    this.engine.scene.add(this.annotationGroup)
    
    this.inspectionRouteGroup = new THREE.Group()
    this.inspectionRouteGroup.name = 'inspectionRoute'
    this.engine.scene.add(this.inspectionRouteGroup)
  }

  public initScene(deviceData: Device[], warehouseSlots: WarehouseSlot[], cameras: Camera[], pipeNodes: PipeNode[]) {
    this.building = createFactoryBuilding()
    this.engine.scene.add(this.building)

    deviceData.forEach(device => {
      let deviceGroup: THREE.Group | null = null
      const pos = new THREE.Vector3(device.position.x, device.position.y, device.position.z)

      switch (device.type) {
        case 'robot':
          deviceGroup = createRobot(pos, device.status)
          break
        case 'cnc':
          deviceGroup = createCNCMachine(pos, device.status)
          break
        case 'conveyor':
          deviceGroup = createConveyor(pos, 20, device.status)
          this.conveyors.push(deviceGroup)
          break
      }

      if (deviceGroup) {
        deviceGroup.userData.deviceId = device.id
        deviceGroup.userData.deviceData = device
        this.devices.set(device.id, deviceGroup)
        this.engine.scene.add(deviceGroup)
      }
    })

    this.warehouse = createWarehouse(new THREE.Vector3(28, 0, 5), warehouseSlots)
    this.engine.scene.add(this.warehouse)

    this.pipeSystem = createPipeSystem(pipeNodes)
    this.engine.scene.add(this.pipeSystem)

    this.cameraSystem = createCameras(cameras)
    this.engine.scene.add(this.cameraSystem)

    this.safetySystem = createSafetyDevices()
    this.engine.scene.add(this.safetySystem)

    this.createMaterialsOnConveyors()
  }

  private createMaterialsOnConveyors() {
    const materialGeo = new THREE.BoxGeometry(0.8, 0.5, 0.8)
    const materialColors = [0x4fc3f7, 0x81c784, 0xffb74d, 0xba68c8]

    for (let i = 0; i < 12; i++) {
      const color = materialColors[i % materialColors.length]
      const materialMat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5 })
      const material = new THREE.Mesh(materialGeo, materialMat)
      material.castShadow = true
      material.position.set(
        -5 + (Math.random() - 0.5) * 0.5,
        1.1,
        -9 + (i * 1.5)
      )
      material.userData.speed = 0.02
      material.userData.baseZ = -9 + (i * 1.5)
      this.materials.push(material)
      this.engine.scene.add(material)
    }
  }

  public update(delta: number, isSimRunning: boolean, simSpeed: number) {
    if (!isSimRunning) return

    this.simulationTime += delta * simSpeed

    this.materials.forEach((material, index) => {
      material.position.z += 0.05 * simSpeed * 60 * delta
      
      if (material.position.z > 10) {
        material.position.z = -9
      }

      material.position.y = 1.1 + Math.sin(this.simulationTime * 2 + index) * 0.02
    })

    this.devices.forEach((deviceGroup, deviceId) => {
      const deviceData = deviceGroup.userData.deviceData
      if (deviceData?.type === 'robot' && deviceData?.status === 'normal') {
        this.animateRobot(deviceGroup)
      }
    })

    this.animateCrane()
  }

  private animateRobot(robotGroup: THREE.Group) {
    const arm1 = robotGroup.children.find(c => c.position.y > 2.5 && c.position.y < 4)
    const arm2 = robotGroup.children.find(c => c.position.x > 0.5)
    
    if (arm1) {
      arm1.rotation.z = Math.sin(this.simulationTime * 1.5) * 0.3
    }
    if (arm2) {
      arm2.rotation.z = -0.5 + Math.sin(this.simulationTime * 2) * 0.4
    }
  }

  private animateCrane() {
    if (!this.building) return
    const crane = this.building.getObjectByName('crane')
    if (crane) {
      crane.position.x = Math.sin(this.simulationTime * 0.3) * 30
    }
  }

  public updateDeviceStatus(deviceId: string, status: Device['status']) {
    const deviceGroup = this.devices.get(deviceId)
    if (deviceGroup) {
      updateDeviceStatus(deviceGroup, status)
      if (deviceGroup.userData.deviceData) {
        deviceGroup.userData.deviceData.status = status
      }
    }
  }

  public getDeviceMeshes(): THREE.Object3D[] {
    return Array.from(this.devices.values())
  }

  public getInteractiveObjects(): THREE.Object3D[] {
    const objects: THREE.Object3D[] = []
    
    this.devices.forEach(d => objects.push(d))
    
    if (this.warehouse) {
      objects.push(this.warehouse)
    }
    if (this.cameraSystem) {
      objects.push(this.cameraSystem)
    }
    if (this.pipeSystem) {
      objects.push(this.pipeSystem)
    }
    
    return objects
  }

  public toggleLabels(show: boolean) {
    // 标签显示/隐藏逻辑
  }

  public togglePipes(show: boolean) {
    if (this.pipeSystem) {
      this.pipeSystem.visible = show
    }
  }

  public toggleCameras(show: boolean) {
    if (this.cameraSystem) {
      this.cameraSystem.visible = show
    }
    if (this.safetySystem) {
      this.safetySystem.visible = show
    }
  }

  public updateMaintenanceStatus(deviceId: string, status: MaintenanceStatus | undefined) {
    if (!status) {
      this.removeMaintenanceMarker(deviceId)
      return
    }

    let marker = this.maintenanceMarkers.get(deviceId)
    const deviceGroup = this.devices.get(deviceId)
    
    if (!deviceGroup) return

    if (!marker) {
      marker = this.createMaintenanceMarker(status)
      this.maintenanceMarkers.set(deviceId, marker)
      deviceGroup.add(marker)
    } else {
      this.updateMaintenanceMarkerColor(marker, status)
    }

    marker.position.set(0, this.getDeviceHeight(deviceGroup) + 1.5, 0)
  }

  private createMaintenanceMarker(status: MaintenanceStatus): THREE.Group {
    const group = new THREE.Group()
    group.name = 'maintenanceMarker'

    const ringGeo = new THREE.TorusGeometry(0.4, 0.08, 8, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: MAINTENANCE_COLORS[status],
      transparent: true,
      opacity: 0.9,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.userData.isRing = true
    group.add(ring)

    const iconGeo = new THREE.ConeGeometry(0.25, 0.6, 6)
    const iconMat = new THREE.MeshBasicMaterial({
      color: MAINTENANCE_COLORS[status],
    })
    const icon = new THREE.Mesh(iconGeo, iconMat)
    icon.position.y = 0.5
    icon.userData.isIcon = true
    group.add(icon)

    group.userData.status = status
    return group
  }

  private updateMaintenanceMarkerColor(marker: THREE.Group, status: MaintenanceStatus) {
    const color = MAINTENANCE_COLORS[status]
    marker.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
        child.material.color.setHex(color)
      }
    })
    marker.userData.status = status
  }

  private removeMaintenanceMarker(deviceId: string) {
    const marker = this.maintenanceMarkers.get(deviceId)
    const deviceGroup = this.devices.get(deviceId)
    if (marker && deviceGroup) {
      deviceGroup.remove(marker)
      this.disposeGroup(marker)
    }
    this.maintenanceMarkers.delete(deviceId)
  }

  private getDeviceHeight(group: THREE.Group): number {
    let maxY = 0
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const box = new THREE.Box3().setFromObject(child)
        maxY = Math.max(maxY, box.max.y)
      }
    })
    return maxY
  }

  public addAnnotation(annotation: Annotation) {
    if (!this.annotationGroup) return

    const marker = this.createAnnotationMarker(annotation)
    this.annotations.set(annotation.id, marker)
    this.annotationGroup.add(marker)
  }

  public removeAnnotation(annotationId: string) {
    const marker = this.annotations.get(annotationId)
    if (marker && this.annotationGroup) {
      this.annotationGroup.remove(marker)
      this.disposeGroup(marker)
    }
    this.annotations.delete(annotationId)
  }

  public updateAnnotation(annotation: Annotation) {
    this.removeAnnotation(annotation.id)
    this.addAnnotation(annotation)
  }

  private createAnnotationMarker(annotation: Annotation): THREE.Group {
    const group = new THREE.Group()
    group.name = 'annotationMarker'
    group.position.set(annotation.position.x, annotation.position.y, annotation.position.z)
    group.userData.annotationId = annotation.id
    group.userData.isAnnotation = true

    const color = ANNOTATION_COLORS[annotation.type]
    
    const pinGeo = new THREE.ConeGeometry(0.3, 1, 8)
    const pinMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: annotation.resolved ? 0.4 : 0.9,
    })
    const pin = new THREE.Mesh(pinGeo, pinMat)
    pin.position.y = 0.5
    pin.rotation.x = Math.PI
    group.add(pin)

    const baseGeo = new THREE.SphereGeometry(0.15, 12, 12)
    const baseMat = new THREE.MeshBasicMaterial({ color })
    const base = new THREE.Mesh(baseGeo, baseMat)
    base.position.y = 1
    group.add(base)

    const ringGeo = new THREE.RingGeometry(0.4, 0.5, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.02
    group.add(ring)

    group.userData.baseScale = 1
    return group
  }

  public toggleAnnotations(show: boolean) {
    if (this.annotationGroup) {
      this.annotationGroup.visible = show
    }
  }

  public getAnnotationObjects(): THREE.Object3D[] {
    return Array.from(this.annotations.values())
  }

  public showInspectionRoute(route: InspectionRoute) {
    if (!this.inspectionRouteGroup) return
    this.clearInspectionRoute()

    const points: THREE.Vector3[] = []

    route.points.forEach((point, index) => {
      const pointMarker = this.createInspectionPointMarker(point, index)
      this.inspectionPoints.set(point.id, pointMarker)
      this.inspectionRouteGroup?.add(pointMarker)
      points.push(new THREE.Vector3(point.position.x, point.position.y, point.position.z))
    })

    if (points.length > 1) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x4fc3f7,
        dashSize: 0.5,
        gapSize: 0.3,
        transparent: true,
        opacity: 0.7,
      })
      this.inspectionLines = new THREE.Line(lineGeo, lineMat)
      this.inspectionLines.computeLineDistances()
      this.inspectionRouteGroup.add(this.inspectionLines)
    }
  }

  private createInspectionPointMarker(point: InspectionPoint, index: number): THREE.Group {
    const group = new THREE.Group()
    group.position.set(point.position.x, point.position.y, point.position.z)
    group.userData.pointId = point.id
    group.userData.isInspectionPoint = true
    group.userData.pointIndex = index

    const sphereGeo = new THREE.SphereGeometry(0.5, 16, 16)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.8,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    group.add(sphere)

    const ringGeo = new THREE.TorusGeometry(0.7, 0.05, 8, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.5,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    group.add(ring)

    return group
  }

  public clearInspectionRoute() {
    if (!this.inspectionRouteGroup) return

    this.inspectionPoints.forEach((marker) => {
      this.inspectionRouteGroup?.remove(marker)
      this.disposeGroup(marker)
    })
    this.inspectionPoints.clear()

    if (this.inspectionLines) {
      this.inspectionRouteGroup.remove(this.inspectionLines)
      this.inspectionLines.geometry.dispose()
      if (this.inspectionLines.material instanceof THREE.Material) {
        this.inspectionLines.material.dispose()
      }
      this.inspectionLines = null
    }
  }

  public toggleInspectionRoute(show: boolean) {
    if (this.inspectionRouteGroup) {
      this.inspectionRouteGroup.visible = show
    }
  }

  public highlightCurrentInspectionPoint(pointId: string) {
    this.inspectionPoints.forEach((marker, id) => {
      const isActive = id === pointId
      marker.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.color.setHex(isActive ? 0xff9800 : 0x4fc3f7)
          child.material.opacity = isActive ? 1 : 0.8
        }
      })
      const targetScale = isActive ? 1.3 : 1
      marker.scale.setScalar(targetScale)
    })
  }

  public getInspectionPointObjects(): THREE.Object3D[] {
    return Array.from(this.inspectionPoints.values())
  }

  public animateAnnotations(time: number) {
    this.annotations.forEach((marker) => {
      const base = marker.children.find(c => c.position.y === 1)
      if (base) {
        base.position.y = 1 + Math.sin(time * 2 + marker.position.x) * 0.1
      }
    })
  }

  private disposeGroup(group: THREE.Group) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })
  }

  public setMaintenanceMarkers(devices: Device[]) {
    devices.forEach(device => {
      if (device.maintenanceStatus) {
        this.updateMaintenanceStatus(device.id, device.maintenanceStatus)
      } else {
        this.removeMaintenanceMarker(device.id)
      }
    })
  }

  public setAnnotations(annotations: Annotation[]) {
    this.annotations.forEach((_, id) => this.removeAnnotation(id))
    annotations.forEach(a => this.addAnnotation(a))
  }

  public dispose() {
    this.devices.forEach(d => {
      this.engine.scene.remove(d)
    })
    this.devices.clear()
    this.materials.forEach(m => {
      this.engine.scene.remove(m)
      m.geometry.dispose()
      if (m.material instanceof THREE.Material) {
        m.material.dispose()
      }
    })
    this.materials = []

    this.maintenanceMarkers.clear()
    this.annotations.clear()
    this.inspectionPoints.clear()
    
    if (this.annotationGroup) {
      this.engine.scene.remove(this.annotationGroup)
    }
    if (this.inspectionRouteGroup) {
      this.engine.scene.remove(this.inspectionRouteGroup)
    }
  }
}
