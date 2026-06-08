import * as THREE from 'three'

export interface ChunkLoadInfo {
  id: string
  position: THREE.Vector3
  radius: number
  objects: THREE.Object3D[]
}

export class ChunkedSceneLoader {
  private chunks: Map<string, { info: ChunkLoadInfo; group: THREE.Group; loaded: boolean }> = new Map()
  private scene: THREE.Scene
  private camera: THREE.Camera
  private loadDistance: number
  private lastUpdate: number = 0
  private updateInterval: number = 1000

  constructor(scene: THREE.Scene, camera: THREE.Camera, loadDistance: number = 80) {
    this.scene = scene
    this.camera = camera
    this.loadDistance = loadDistance
  }

  public addChunk(info: ChunkLoadInfo) {
    const group = new THREE.Group()
    group.position.copy(info.position)
    group.visible = false
    
    info.objects.forEach(obj => group.add(obj))
    
    this.chunks.set(info.id, { info, group, loaded: false })
    this.scene.add(group)
  }

  public removeChunk(id: string) {
    const chunk = this.chunks.get(id)
    if (chunk) {
      this.scene.remove(chunk.group)
      this.disposeGroup(chunk.group)
      this.chunks.delete(id)
    }
  }

  public update(currentTime: number) {
    if (currentTime - this.lastUpdate < this.updateInterval) return
    this.lastUpdate = currentTime

    const cameraPos = this.camera.position

    this.chunks.forEach((chunk, id) => {
      const distance = cameraPos.distanceTo(chunk.info.position)
      const shouldBeVisible = distance < this.loadDistance + chunk.info.radius
      
      if (chunk.loaded !== shouldBeVisible) {
        chunk.group.visible = shouldBeVisible
        chunk.loaded = shouldBeVisible
        
        if (shouldBeVisible) {
          this.onChunkLoaded?.(id)
        } else {
          this.onChunkUnloaded?.(id)
        }
      }
    })
  }

  public onChunkLoaded?: (id: string) => void
  public onChunkUnloaded?: (id: string) => void

  public getLoadedChunkCount(): number {
    let count = 0
    this.chunks.forEach(chunk => {
      if (chunk.loaded) count++
    })
    return count
  }

  private disposeGroup(group: THREE.Group) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }

  public dispose() {
    this.chunks.forEach(chunk => {
      this.scene.remove(chunk.group)
      this.disposeGroup(chunk.group)
    })
    this.chunks.clear()
  }
}

export class LazyResourceLoader {
  private cache: Map<string, any> = new Map()
  private loading: Map<string, Promise<any>> = new Map()

  public async loadTexture(url: string): Promise<THREE.Texture> {
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }

    if (this.loading.has(url)) {
      return this.loading.get(url)
    }

    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      const loader = new THREE.TextureLoader()
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          this.cache.set(url, texture)
          this.loading.delete(url)
          resolve(texture)
        },
        undefined,
        (error) => {
          this.loading.delete(url)
          reject(error)
        }
      )
    })

    this.loading.set(url, promise)
    return promise
  }

  public async loadModel(url: string): Promise<THREE.Group> {
    if (this.cache.has(url)) {
      return this.cache.get(url).clone()
    }

    if (this.loading.has(url)) {
      const model = await this.loading.get(url)
      return model.clone()
    }

    const promise = new Promise<THREE.Group>(async (resolve, reject) => {
      try {
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshStandardMaterial({ color: 0x888888 })
        const mesh = new THREE.Mesh(geometry, material)
        const group = new THREE.Group()
        group.add(mesh)
        
        this.cache.set(url, group)
        this.loading.delete(url)
        resolve(group.clone())
      } catch (error) {
        this.loading.delete(url)
        reject(error)
      }
    })

    this.loading.set(url, promise)
    return promise
  }

  public getCacheSize(): number {
    return this.cache.size
  }

  public clearCache() {
    this.cache.forEach(item => {
      if (item instanceof THREE.Texture) {
        item.dispose()
      }
    })
    this.cache.clear()
  }

  public preload(urls: string[], type: 'texture' | 'model'): Promise<void[]> {
    return Promise.all(
      urls.map(url => 
        type === 'texture' 
          ? this.loadTexture(url).then(() => undefined)
          : this.loadModel(url).then(() => undefined)
      )
    )
  }
}
