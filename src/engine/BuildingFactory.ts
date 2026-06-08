import * as THREE from 'three'

export function createFactoryBuilding(): THREE.Group {
  const group = new THREE.Group()

  const floorGeo = new THREE.PlaneGeometry(100, 60)
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x2a3a4a, 
    roughness: 0.9, 
    metalness: 0.1 
  })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  floor.position.y = 0.02
  group.add(floor)

  const wallMat = new THREE.MeshStandardMaterial({ 
    color: 0x5a6a7a, 
    roughness: 0.7, 
    metalness: 0.2,
    transparent: true,
    opacity: 0.3
  })
  const roofMat = new THREE.MeshStandardMaterial({ 
    color: 0x4a5a6a, 
    roughness: 0.6, 
    metalness: 0.3,
    transparent: true,
    opacity: 0.25
  })

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(100, 12, 0.5), wallMat)
  backWall.position.set(0, 6, -30)
  backWall.castShadow = true
  backWall.receiveShadow = true
  group.add(backWall)

  const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(35, 12, 0.5), wallMat)
  frontWallLeft.position.set(-32.5, 6, 30)
  frontWallLeft.castShadow = true
  frontWallLeft.receiveShadow = true
  group.add(frontWallLeft)

  const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(35, 12, 0.5), wallMat)
  frontWallRight.position.set(32.5, 6, 30)
  frontWallRight.castShadow = true
  frontWallRight.receiveShadow = true
  group.add(frontWallRight)

  const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(30, 3, 0.5), wallMat)
  frontWallTop.position.set(0, 10.5, 30)
  frontWallTop.castShadow = true
  frontWallTop.receiveShadow = true
  group.add(frontWallTop)

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 12, 60), wallMat)
  leftWall.position.set(-50, 6, 0)
  leftWall.castShadow = true
  leftWall.receiveShadow = true
  group.add(leftWall)

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 12, 60), wallMat)
  rightWall.position.set(50, 6, 0)
  rightWall.castShadow = true
  rightWall.receiveShadow = true
  group.add(rightWall)

  const roof = new THREE.Mesh(new THREE.BoxGeometry(102, 1, 62), roofMat)
  roof.position.set(0, 12.5, 0)
  roof.castShadow = true
  roof.receiveShadow = true
  group.add(roof)

  const windowMat = new THREE.MeshStandardMaterial({ 
    color: 0x87ceeb, 
    transparent: true, 
    opacity: 0.6,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0x4488aa,
    emissiveIntensity: 0.1
  })

  for (let i = -35; i <= 35; i += 10) {
    const window1 = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.1), windowMat)
    window1.position.set(i, 7, -29.7)
    group.add(window1)

    const window2 = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.1), windowMat)
    window2.position.set(i, 7, 29.7)
    group.add(window2)
  }

  for (let i = -20; i <= 20; i += 10) {
    const window1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 6), windowMat)
    window1.position.set(-49.7, 7, i)
    group.add(window1)

    const window2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 6), windowMat)
    window2.position.set(49.7, 7, i)
    group.add(window2)
  }

  const pillarGeo = new THREE.BoxGeometry(1, 12, 1)
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, metalness: 0.6, roughness: 0.4 })
  const pillarPositions = [
    [-40, 0, -20], [-40, 0, 0], [-40, 0, 20],
    [-20, 0, -25], [-20, 0, 25],
    [0, 0, -25], [0, 0, 25],
    [20, 0, -25], [20, 0, 25],
    [40, 0, -20], [40, 0, 0], [40, 0, 20],
  ]
  pillarPositions.forEach(pos => {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat)
    pillar.position.set(pos[0], 6, pos[2])
    pillar.castShadow = true
    pillar.receiveShadow = true
    group.add(pillar)
  })

  const craneRailGeo = new THREE.BoxGeometry(90, 0.5, 0.8)
  const craneRailMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.8, roughness: 0.2 })
  const craneRail1 = new THREE.Mesh(craneRailGeo, craneRailMat)
  craneRail1.position.set(0, 11, -25)
  group.add(craneRail1)
  const craneRail2 = new THREE.Mesh(craneRailGeo, craneRailMat)
  craneRail2.position.set(0, 11, 25)
  group.add(craneRail2)

  const craneGeo = new THREE.BoxGeometry(8, 1.5, 5)
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xffa500, metalness: 0.7, roughness: 0.3 })
  const crane = new THREE.Mesh(craneGeo, craneMat)
  crane.position.set(0, 12, 0)
  crane.castShadow = true
  crane.name = 'crane'
  group.add(crane)

  const stripGeo = new THREE.PlaneGeometry(98, 2)
  const stripMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0066aa, emissiveIntensity: 0.3 })
  
  const strip1 = new THREE.Mesh(stripGeo, stripMat)
  strip1.rotation.x = -Math.PI / 2
  strip1.position.set(0, 0.03, -28)
  group.add(strip1)

  const strip2 = new THREE.Mesh(stripGeo, stripMat)
  strip2.rotation.x = -Math.PI / 2
  strip2.position.set(0, 0.03, 28)
  group.add(strip2)

  const areaLabelGeo = new THREE.PlaneGeometry(8, 2)
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(79, 195, 247, 0.1)'
  ctx.fillRect(0, 0, 512, 128)
  ctx.strokeStyle = 'rgba(79, 195, 247, 0.5)'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, 508, 124)
  ctx.fillStyle = '#4fc3f7'
  ctx.font = 'bold 48px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const areas = [
    { name: '焊接区', pos: [-30, 0.04, -12] },
    { name: '加工区', pos: [5, 0.04, -12] },
    { name: '装配区', pos: [-15, 0.04, 15] },
    { name: '仓储区', pos: [35, 0.04, 15] },
  ]

  areas.forEach(area => {
    ctx.clearRect(0, 0, 512, 128)
    ctx.fillStyle = 'rgba(79, 195, 247, 0.08)'
    ctx.fillRect(0, 0, 512, 128)
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.4)'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, 508, 124)
    ctx.fillStyle = '#4fc3f7'
    ctx.fillText(area.name, 256, 64)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    const label = new THREE.Mesh(areaLabelGeo, labelMat)
    label.rotation.x = -Math.PI / 2
    label.position.set(area.pos[0], area.pos[1], area.pos[2])
    label.name = 'areaLabel'
    group.add(label)
  })

  return group
}
