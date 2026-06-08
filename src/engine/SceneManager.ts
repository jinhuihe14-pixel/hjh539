import * as THREE from 'three'
import { SceneEngine } from './SceneEngine'
import { createFactoryBuilding } from './BuildingFactory'
import { createRobot, createCNCMachine, createConveyor, updateDeviceStatus } from './DeviceFactory'
import { createWarehouse } from './WarehouseFactory'
import { createPipeSystem, createCameras, createSafetyDevices } from './SecurityFactory'
import type { Device, WarehouseSlot, Camera, PipeNode } from '../types'

export class SceneManager {
  private engine: SceneEngine
  private building: THREE.Group | null = null
  private devices: Map<string, THREE.Group> = new Map()
  private warehouse: THREE.Group | null = null
  private pipeSystem: THREE.Group | null = null
  private cameraSystem: THREE.Group | null = null
  private safetySystem: THREE.Group | null = null
  private labels: THREE.Group[] = []
  
  private conveyors: THREE.Group[] = []
  private materials: THREE.Mesh[] = []
  private simulationTime: number = 0

  constructor(engine: SceneEngine) {
    this.engine = engine
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
  }
}
