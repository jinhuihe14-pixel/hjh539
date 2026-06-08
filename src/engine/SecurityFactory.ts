import * as THREE from 'three'
import type { Camera, PipeNode } from '../types'

const PIPE_TYPE_COLORS: Record<string, number> = {
  water: 0x4fc3f7,
  gas: 0xffcc80,
  electric: 0xffd54f,
  signal: 0xba68c8,
}

export function createPipeSystem(nodes: PipeNode[]): THREE.Group {
  const group = new THREE.Group()
  group.name = 'pipeSystem'
  group.userData.isPipeSystem = true

  const nodeMap = new Map<string, PipeNode>()
  nodes.forEach(node => nodeMap.set(node.id, node))

  const visitedConnections = new Set<string>()

  nodes.forEach(node => {
    node.connections.forEach(connId => {
      const connKey = [node.id, connId].sort().join('-')
      if (visitedConnections.has(connKey)) return
      visitedConnections.add(connKey)

      const targetNode = nodeMap.get(connId)
      if (!targetNode) return

      const pipe = createPipe(
        new THREE.Vector3(node.position.x, node.position.y, node.position.z),
        new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z),
        node.type,
        node.status === 'abnormal' || targetNode.status === 'abnormal'
      )
      group.add(pipe)
    })

    const nodeMesh = createPipeNode(node)
    group.add(nodeMesh)
  })

  return group
}

function createPipe(start: THREE.Vector3, end: THREE.Vector3, type: string, isAbnormal: boolean): THREE.Group {
  const group = new THREE.Group()

  const midY = Math.max(start.y, end.y) + 2

  const points = [
    start.clone(),
    new THREE.Vector3(start.x, midY, start.z),
    new THREE.Vector3(end.x, midY, end.z),
    end.clone(),
  ]

  const curve = new THREE.CatmullRomCurve3(points)
  const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.15, 8, false)
  const color = PIPE_TYPE_COLORS[type]
  const tubeMat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.7,
    roughness: 0.3,
    emissive: isAbnormal ? color : 0x000000,
    emissiveIntensity: isAbnormal ? 0.3 : 0,
  })
  const tube = new THREE.Mesh(tubeGeo, tubeMat)
  tube.castShadow = true
  group.add(tube)

  if (isAbnormal) {
    group.userData.isAbnormal = true
  }

  return group
}

function createPipeNode(node: PipeNode): THREE.Group {
  const group = new THREE.Group()
  group.position.set(node.position.x, node.position.y, node.position.z)
  group.userData.nodeId = node.id
  group.userData.nodeData = node

  const valveGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
  const color = PIPE_TYPE_COLORS[node.type]
  const valveMat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.8,
    roughness: 0.2,
    emissive: node.status === 'abnormal' ? color : 0x000000,
    emissiveIntensity: node.status === 'abnormal' ? 0.5 : 0,
  })
  const valve = new THREE.Mesh(valveGeo, valveMat)
  valve.castShadow = true
  group.add(valve)

  const indicatorGeo = new THREE.SphereGeometry(0.15, 16, 16)
  const indicatorMat = new THREE.MeshBasicMaterial({
    color: node.status === 'normal' ? 0x4caf50 : 0xf44336,
  })
  const indicator = new THREE.Mesh(indicatorGeo, indicatorMat)
  indicator.position.y = 0.5
  indicator.name = 'statusIndicator'
  group.add(indicator)

  return group
}

export function createCameras(cameras: Camera[]): THREE.Group {
  const group = new THREE.Group()
  group.name = 'cameraSystem'
  group.userData.isCameraSystem = true

  cameras.forEach(cam => {
    const camGroup = createCameraDevice(cam)
    group.add(camGroup)
  })

  return group
}

function createCameraDevice(camera: Camera): THREE.Group {
  const group = new THREE.Group()
  group.position.set(camera.position.x, camera.position.y, camera.position.z)
  group.userData.cameraId = camera.id
  group.userData.cameraData = camera

  const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, camera.position.y, 8)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, metalness: 0.6, roughness: 0.4 })
  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.position.y = -camera.position.y / 2
  pole.castShadow = true
  group.add(pole)

  const baseGeo = new THREE.BoxGeometry(0.5, 0.3, 0.4)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.7, roughness: 0.3 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.castShadow = true
  group.add(base)

  const lensGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.2, 12)
  const lensMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a, 
    metalness: 0.9, 
    roughness: 0.1,
    emissive: camera.status === 'online' ? 0x4caf50 : 0x555555,
    emissiveIntensity: 0.3,
  })
  const lens = new THREE.Mesh(lensGeo, lensMat)
  lens.rotation.x = Math.PI / 2
  lens.position.z = 0.25
  group.add(lens)

  if (camera.type === 'ptz') {
    const domeGeo = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    const domeMat = new THREE.MeshStandardMaterial({ 
      color: 0x3a4a5a, 
      metalness: 0.5, 
      roughness: 0.3,
      transparent: true,
      opacity: 0.8,
    })
    const dome = new THREE.Mesh(domeGeo, domeMat)
    dome.position.y = 0.15
    group.add(dome)
  }

  const statusGeo = new THREE.SphereGeometry(0.06, 12, 12)
  const statusMat = new THREE.MeshBasicMaterial({
    color: camera.status === 'online' ? 0x4caf50 : 0xf44336,
  })
  const statusLight = new THREE.Mesh(statusGeo, statusMat)
  statusLight.position.set(0, 0.25, -0.15)
  statusLight.name = 'statusLight'
  group.add(statusLight)

  return group
}

export function createSafetyDevices(): THREE.Group {
  const group = new THREE.Group()
  group.name = 'safetySystem'

  const smokeDetectors = [
    [-30, 11.5, -20],
    [-10, 11.5, -20],
    [10, 11.5, 20],
    [30, 11.5, -10],
    [-20, 11.5, 15],
    [20, 11.5, 0],
  ]

  smokeDetectors.forEach(pos => {
    const detector = createSmokeDetector()
    detector.position.set(pos[0], pos[1], pos[2])
    group.add(detector)
  })

  const extinguisherPositions = [
    [-45, 0.5, -25],
    [-45, 0.5, 25],
    [45, 0.5, -25],
    [45, 0.5, 25],
  ]

  extinguisherPositions.forEach(pos => {
    const extinguisher = createFireExtinguisher()
    extinguisher.position.set(pos[0], pos[1], pos[2])
    group.add(extinguisher)
  })

  const alarmLights = [
    [-40, 11.5, 0],
    [0, 11.5, -28],
    [0, 11.5, 28],
    [40, 11.5, 0],
  ]

  alarmLights.forEach(pos => {
    const light = createAlarmLight()
    light.position.set(pos[0], pos[1], pos[2])
    group.add(light)
  })

  return group
}

function createSmokeDetector(): THREE.Group {
  const group = new THREE.Group()

  const baseGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.1, 16)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  group.add(base)

  const sensorGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.08, 12)
  const sensorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 })
  const sensor = new THREE.Mesh(sensorGeo, sensorMat)
  sensor.position.y = -0.08
  group.add(sensor)

  return group
}

function createFireExtinguisher(): THREE.Group {
  const group = new THREE.Group()

  const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe53935, metalness: 0.5, roughness: 0.4 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.3
  body.castShadow = true
  group.add(body)

  const topGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.1, 12)
  const topMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 })
  const top = new THREE.Mesh(topGeo, topMat)
  top.position.y = 0.65
  group.add(top)

  const hoseGeo = new THREE.TorusGeometry(0.1, 0.02, 8, 16, Math.PI)
  const hoseMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 })
  const hose = new THREE.Mesh(hoseGeo, hoseMat)
  hose.rotation.x = Math.PI / 2
  hose.position.set(0.15, 0.3, 0)
  group.add(hose)

  return group
}

function createAlarmLight(): THREE.Group {
  const group = new THREE.Group()

  const baseGeo = new THREE.CylinderGeometry(0.15, 0.1, 0.15, 16)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  group.add(base)

  const lightGeo = new THREE.SphereGeometry(0.12, 16, 16)
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 })
  const light = new THREE.Mesh(lightGeo, lightMat)
  light.position.y = 0.12
  light.name = 'alarmLight'
  group.add(light)

  return group
}
