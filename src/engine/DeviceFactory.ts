import * as THREE from 'three'
import type { DeviceStatus } from '../types'

const STATUS_COLORS: Record<DeviceStatus, number> = {
  normal: 0x4caf50,
  standby: 0xffc107,
  fault: 0xf44336,
  maintenance: 0x9e9e9e,
}

export const getStatusColor = (status: DeviceStatus): number => STATUS_COLORS[status]

export function createRobot(position: THREE.Vector3, status: DeviceStatus): THREE.Group {
  const group = new THREE.Group()
  group.position.copy(position)
  group.userData.isDevice = true
  group.userData.deviceType = 'robot'

  const baseGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.6, 24)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, metalness: 0.7, roughness: 0.3 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.y = 0.3
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)

  const bodyGeo = new THREE.BoxGeometry(1.8, 1.2, 1.2)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, metalness: 0.6, roughness: 0.4 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 1.2
  body.castShadow = true
  group.add(body)

  const joint1Geo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16)
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.8, roughness: 0.2 })
  const joint1 = new THREE.Mesh(joint1Geo, jointMat)
  joint1.position.y = 2
  joint1.castShadow = true
  group.add(joint1)

  const arm1Geo = new THREE.BoxGeometry(0.4, 2.5, 0.4)
  const armMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, metalness: 0.7, roughness: 0.3 })
  const arm1 = new THREE.Mesh(arm1Geo, armMat)
  arm1.position.set(0, 3.2, 0)
  arm1.castShadow = true
  group.add(arm1)

  const joint2 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), jointMat)
  joint2.position.y = 4.5
  joint2.castShadow = true
  group.add(joint2)

  const arm2Geo = new THREE.BoxGeometry(0.3, 1.8, 0.3)
  const arm2 = new THREE.Mesh(arm2Geo, armMat)
  arm2.position.set(0.8, 5.2, 0)
  arm2.rotation.z = -0.5
  arm2.castShadow = true
  group.add(arm2)

  const gripperGeo = new THREE.BoxGeometry(0.6, 0.3, 0.5)
  const gripperMat = new THREE.MeshStandardMaterial({ color: STATUS_COLORS[status], metalness: 0.9, roughness: 0.1, emissive: STATUS_COLORS[status], emissiveIntensity: 0.2 })
  const gripper = new THREE.Mesh(gripperGeo, gripperMat)
  gripper.position.set(1.5, 5.8, 0)
  gripper.castShadow = true
  group.add(gripper)

  const statusLightGeo = new THREE.SphereGeometry(0.15, 16, 16)
  const statusLightMat = new THREE.MeshBasicMaterial({ color: STATUS_COLORS[status] })
  const statusLight = new THREE.Mesh(statusLightGeo, statusLightMat)
  statusLight.position.set(0, 2.8, 0.7)
  statusLight.name = 'statusLight'
  group.add(statusLight)

  return group
}

export function createCNCMachine(position: THREE.Vector3, status: DeviceStatus): THREE.Group {
  const group = new THREE.Group()
  group.position.copy(position)
  group.userData.isDevice = true
  group.userData.deviceType = 'cnc'

  const baseGeo = new THREE.BoxGeometry(3, 0.8, 2.5)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, metalness: 0.6, roughness: 0.4 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.y = 0.4
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)

  const bodyGeo = new THREE.BoxGeometry(2.8, 2.5, 2.3)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, metalness: 0.5, roughness: 0.5 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 2.05
  body.castShadow = true
  group.add(body)

  const windowGeo = new THREE.BoxGeometry(2, 1.2, 0.1)
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, transparent: true, opacity: 0.7, metalness: 0.9, roughness: 0.1 })
  const window1 = new THREE.Mesh(windowGeo, windowMat)
  window1.position.set(0, 2.2, 1.21)
  group.add(window1)

  const controlPanelGeo = new THREE.BoxGeometry(0.6, 0.8, 0.15)
  const controlMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.7, roughness: 0.3 })
  const controlPanel = new THREE.Mesh(controlPanelGeo, controlMat)
  controlPanel.position.set(-1.5, 1.5, 1.2)
  controlPanel.rotation.y = -0.2
  group.add(controlPanel)

  const screenGeo = new THREE.PlaneGeometry(0.45, 0.35)
  const screenMat = new THREE.MeshBasicMaterial({ color: STATUS_COLORS[status] })
  const screen = new THREE.Mesh(screenGeo, screenMat)
  screen.position.set(-1.5, 1.65, 1.3)
  screen.rotation.y = -0.2
  screen.name = 'statusScreen'
  group.add(screen)

  const chimneyGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 16)
  const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.8, roughness: 0.2 })
  const chimney = new THREE.Mesh(chimneyGeo, chimneyMat)
  chimney.position.set(0.8, 3.8, 0)
  chimney.castShadow = true
  group.add(chimney)

  const statusLightGeo = new THREE.SphereGeometry(0.1, 12, 12)
  const statusLightMat = new THREE.MeshBasicMaterial({ color: STATUS_COLORS[status] })
  const statusLight = new THREE.Mesh(statusLightGeo, statusLightMat)
  statusLight.position.set(0, 3.4, 0)
  statusLight.name = 'statusLight'
  group.add(statusLight)

  return group
}

export function createConveyor(position: THREE.Vector3, length: number = 20, status: DeviceStatus = 'normal'): THREE.Group {
  const group = new THREE.Group()
  group.position.copy(position)
  group.userData.isDevice = true
  group.userData.deviceType = 'conveyor'

  const frameGeo = new THREE.BoxGeometry(0.3, 0.8, length)
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, metalness: 0.6, roughness: 0.4 })
  
  const leftFrame = new THREE.Mesh(frameGeo, frameMat)
  leftFrame.position.set(-0.9, 0.4, 0)
  leftFrame.castShadow = true
  group.add(leftFrame)

  const rightFrame = new THREE.Mesh(frameGeo, frameMat)
  rightFrame.position.set(0.9, 0.4, 0)
  rightFrame.castShadow = true
  group.add(rightFrame)

  const legGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.7, roughness: 0.3 })
  for (let i = -length / 2 + 2; i < length / 2; i += 4) {
    const leg1 = new THREE.Mesh(legGeo, legMat)
    leg1.position.set(-0.9, -0.4, i)
    leg1.receiveShadow = true
    group.add(leg1)
    
    const leg2 = new THREE.Mesh(legGeo, legMat)
    leg2.position.set(0.9, -0.4, i)
    leg2.receiveShadow = true
    group.add(leg2)
  }

  const beltGeo = new THREE.PlaneGeometry(1.6, length)
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8, metalness: 0.1 })
  const belt = new THREE.Mesh(beltGeo, beltMat)
  belt.rotation.x = -Math.PI / 2
  belt.position.y = 0.81
  belt.name = 'belt'
  group.add(belt)

  const rollerGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 12)
  const rollerMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.8, roughness: 0.2 })
  for (let i = -length / 2 + 1; i < length / 2; i += 1.5) {
    const roller = new THREE.Mesh(rollerGeo, rollerMat)
    roller.rotation.z = Math.PI / 2
    roller.position.set(0, 0.72, i)
    group.add(roller)
  }

  const motorGeo = new THREE.BoxGeometry(0.6, 0.6, 0.8)
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, metalness: 0.7, roughness: 0.3 })
  const motor = new THREE.Mesh(motorGeo, motorMat)
  motor.position.set(1.5, 0.5, -length / 2 + 2)
  motor.castShadow = true
  group.add(motor)

  return group
}

export function updateDeviceStatus(deviceGroup: THREE.Group, status: DeviceStatus) {
  const color = STATUS_COLORS[status]
  
  deviceGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.name === 'statusLight' || child.name === 'statusScreen') {
        if (child.material instanceof THREE.MeshBasicMaterial) {
          child.material.color.setHex(color)
        }
      }
    }
  })

  if (status === 'fault') {
    startBlinkAnimation(deviceGroup)
  } else {
    stopBlinkAnimation(deviceGroup)
  }
}

function startBlinkAnimation(group: THREE.Group) {
  let visible = true
  const animate = () => {
    if (!group.userData.isFault) return
    visible = !visible
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === 'statusLight') {
        child.visible = visible
      }
    })
    setTimeout(animate, 300)
  }
  group.userData.isFault = true
  animate()
}

function stopBlinkAnimation(group: THREE.Group) {
  group.userData.isFault = false
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name === 'statusLight') {
      child.visible = true
    }
  })
}
