import * as THREE from 'three'

export class LODSystem {
  private lods: Map<string, THREE.LOD> = new Map()
  private camera: THREE.Camera
  private scene: THREE.Scene
  private lastUpdate: number = 0
  private updateInterval: number = 500

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene
    this.camera = camera
  }

  public addLOD(id: string, levels: { distance: number; object: THREE.Object3D }[]): THREE.LOD {
    const lod = new THREE.LOD()
    levels.forEach(level => {
      lod.addLevel(level.object, level.distance)
    })
    this.lods.set(id, lod)
    this.scene.add(lod)
    return lod
  }

  public removeLOD(id: string) {
    const lod = this.lods.get(id)
    if (lod) {
      this.scene.remove(lod)
      this.lods.delete(id)
    }
  }

  public update(currentTime: number) {
    if (currentTime - this.lastUpdate < this.updateInterval) return
    this.lastUpdate = currentTime

    this.lods.forEach(lod => {
      lod.update(this.camera)
    })
  }

  public dispose() {
    this.lods.forEach(lod => {
      this.scene.remove(lod)
      lod.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    })
    this.lods.clear()
  }
}

export function createDetailedModel(baseGeometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(baseGeometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function createSimplifiedModel(geometry: THREE.BufferGeometry, material: THREE.Material, ratio: number = 0.5): THREE.Mesh {
  const simplified = geometry.clone()
  const positionAttr = simplified.getAttribute('position')
  const originalCount = positionAttr.count
  const simplifiedCount = Math.floor(originalCount * ratio)
  
  if (simplified.index) {
    const newIndex = new Uint32Array(simplifiedCount * 3)
    const oldIndex = simplified.index.array
    for (let i = 0; i < simplifiedCount * 3; i++) {
      newIndex[i] = oldIndex[i % oldIndex.length]
    }
    simplified.setIndex(new THREE.BufferAttribute(newIndex, 1))
  }
  
  const mesh = new THREE.Mesh(simplified, material)
  mesh.castShadow = false
  return mesh
}

export function mergeGeometries(objects: THREE.Mesh[]): THREE.Mesh | null {
  if (objects.length === 0) return null

  const geometries: THREE.BufferGeometry[] = []
  const material = objects[0].material as THREE.Material

  objects.forEach(obj => {
    const geo = obj.geometry.clone()
    geo.applyMatrix4(obj.matrix)
    geometries.push(geo)
  })

  const mergedGeo = mergeBufferGeometries(geometries)
  if (!mergedGeo) return null

  const mergedMesh = new THREE.Mesh(mergedGeo, material)
  mergedMesh.castShadow = objects[0].castShadow
  mergedMesh.receiveShadow = objects[0].receiveShadow

  return mergedMesh
}

function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geometries.length === 0) return null

  const mergedGeometry = new THREE.BufferGeometry()
  
  const attributes = new Map<string, THREE.BufferAttribute[]>()
  let totalVertexCount = 0

  geometries.forEach(geo => {
    totalVertexCount += geo.getAttribute('position').count
    
    Object.keys(geo.attributes).forEach(attrName => {
      const attr = geo.getAttribute(attrName) as THREE.BufferAttribute
      if (!attributes.has(attrName)) {
        attributes.set(attrName, [])
      }
      attributes.get(attrName)!.push(attr)
    })
  })

  attributes.forEach((attrList, attrName) => {
    if (attrList.length !== geometries.length) return
    
    const itemSize = attrList[0].itemSize
    const TypedArray = attrList[0].array.constructor as any
    const mergedArray = new TypedArray(totalVertexCount * itemSize)
    
    let offset = 0
    attrList.forEach(attr => {
      mergedArray.set(attr.array, offset)
      offset += attr.array.length
    })
    
    mergedGeometry.setAttribute(attrName, new THREE.BufferAttribute(mergedArray, itemSize))
  })

  const indices: number[] = []
  let vertexOffset = 0
  
  geometries.forEach(geo => {
    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices.push(geo.index.getX(i) + vertexOffset)
      }
    } else {
      for (let i = 0; i < geo.getAttribute('position').count; i++) {
        indices.push(i + vertexOffset)
      }
    }
    vertexOffset += geo.getAttribute('position').count
  })

  if (indices.length > 0) {
    mergedGeometry.setIndex(indices)
  }

  return mergedGeometry
}
