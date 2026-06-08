import * as THREE from 'three'
import type { WarehouseSlot } from '../types'

const SLOT_STATUS_COLORS: Record<string, number> = {
  occupied: 0x4fc3f7,
  empty: 0x2a4a6a,
  pending: 0xffb74d,
}

export function createWarehouse(position: THREE.Vector3, slots: WarehouseSlot[]): THREE.Group {
  const group = new THREE.Group()
  group.position.copy(position)
  group.userData.isWarehouse = true

  const shelfWidth = 2.2
  const shelfDepth = 1.5
  const shelfHeight = 1.8
  const aisleWidth = 2.5
  const rows = 3
  const cols = 8
  const levels = 5

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const shelfGroup = new THREE.Group()
      const x = col * shelfWidth
      const z = row * (shelfDepth + aisleWidth)

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, metalness: 0.6, roughness: 0.4 })
      
      const uprightGeo = new THREE.BoxGeometry(0.1, levels * shelfHeight, 0.1)
      const upright1 = new THREE.Mesh(uprightGeo, frameMat)
      upright1.position.set(-shelfWidth / 2 + 0.05, levels * shelfHeight / 2, -shelfDepth / 2 + 0.05)
      upright1.castShadow = true
      shelfGroup.add(upright1)

      const upright2 = new THREE.Mesh(uprightGeo, frameMat)
      upright2.position.set(shelfWidth / 2 - 0.05, levels * shelfHeight / 2, -shelfDepth / 2 + 0.05)
      upright2.castShadow = true
      shelfGroup.add(upright2)

      const upright3 = new THREE.Mesh(uprightGeo, frameMat)
      upright3.position.set(-shelfWidth / 2 + 0.05, levels * shelfHeight / 2, shelfDepth / 2 - 0.05)
      upright3.castShadow = true
      shelfGroup.add(upright3)

      const upright4 = new THREE.Mesh(uprightGeo, frameMat)
      upright4.position.set(shelfWidth / 2 - 0.05, levels * shelfHeight / 2, shelfDepth / 2 - 0.05)
      upright4.castShadow = true
      shelfGroup.add(upright4)

      for (let level = 0; level < levels; level++) {
        const shelfGeo = new THREE.BoxGeometry(shelfWidth - 0.1, 0.08, shelfDepth - 0.1)
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, metalness: 0.5, roughness: 0.5 })
        const shelf = new THREE.Mesh(shelfGeo, shelfMat)
        shelf.position.y = level * shelfHeight + 0.04
        shelf.receiveShadow = true
        shelfGroup.add(shelf)

        const slotId = `slot-${row}-${col}-${level}`
        const slotData = slots.find(s => s.id === slotId)
        if (slotData && slotData.status === 'occupied') {
          const pallet = createPallet(slotData)
          pallet.position.set(0, level * shelfHeight + 0.08, 0)
          pallet.name = `slot-${row}-${col}-${level}`
          pallet.userData.slotId = slotId
          pallet.userData.slotData = slotData
          shelfGroup.add(pallet)
        } else if (slotData && slotData.status === 'pending') {
          const indicatorGeo = new THREE.BoxGeometry(shelfWidth * 0.6, 0.1, shelfDepth * 0.6)
          const indicatorMat = new THREE.MeshBasicMaterial({ color: SLOT_STATUS_COLORS.pending, transparent: true, opacity: 0.8 })
          const indicator = new THREE.Mesh(indicatorGeo, indicatorMat)
          indicator.position.y = level * shelfHeight + 0.15
          indicator.name = `slot-${row}-${col}-${level}`
          indicator.userData.slotId = slotId
          indicator.userData.slotData = slotData
          shelfGroup.add(indicator)
        }
      }

      shelfGroup.position.set(x, 0, z)
      group.add(shelfGroup)
    }
  }

  const floorGeo = new THREE.PlaneGeometry(cols * shelfWidth + 4, rows * (shelfDepth + aisleWidth) + aisleWidth)
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.9 })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(cols * shelfWidth / 2 - shelfWidth / 2, -0.01, (rows - 1) * (shelfDepth + aisleWidth) / 2)
  floor.receiveShadow = true
  group.add(floor)

  return group
}

function createPallet(slotData: WarehouseSlot): THREE.Group {
  const group = new THREE.Group()

  const palletGeo = new THREE.BoxGeometry(1.8, 0.15, 1.2)
  const palletMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 })
  const pallet = new THREE.Mesh(palletGeo, palletMat)
  pallet.position.y = 0.075
  pallet.castShadow = true
  pallet.receiveShadow = true
  group.add(pallet)

  const boxColors = [0x4fc3f7, 0x81c784, 0xffb74d, 0xba68c8]
  const boxColor = boxColors[Math.floor(Math.random() * boxColors.length)]
  
  const boxGeo = new THREE.BoxGeometry(1.5, 1, 1)
  const boxMat = new THREE.MeshStandardMaterial({ color: boxColor, roughness: 0.6, metalness: 0.2 })
  const box = new THREE.Mesh(boxGeo, boxMat)
  box.position.y = 0.15 + 0.5
  box.castShadow = true
  group.add(box)

  const labelGeo = new THREE.PlaneGeometry(0.5, 0.25)
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 256, 128)
  ctx.fillStyle = '#333333'
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(slotData.materialId || '', 128, 64)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const labelMat = new THREE.MeshBasicMaterial({ map: texture })
  const label = new THREE.Mesh(labelGeo, labelMat)
  label.position.set(0, 0.15 + 0.6, 0.51)
  group.add(label)

  return group
}

export function updateSlotStatus(slotGroup: THREE.Object3D, status: WarehouseSlot['status']) {
  // 货位状态更新逻辑
}

export function locateAndHighlightSlot(warehouseGroup: THREE.Group, slotId: string): THREE.Object3D | null {
  let found: THREE.Object3D | null = null
  warehouseGroup.traverse((child) => {
    if (child.userData.slotId === slotId) {
      found = child
      child.traverse((c) => {
        if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
          c.material.emissive = new THREE.Color(0xffff00)
          c.material.emissiveIntensity = 0.5
        }
      })
    }
  })
  return found
}
