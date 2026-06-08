import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js'
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js'
import type { ViewMode } from '../types'

export class SceneEngine {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public container: HTMLElement
  
  private orbitControls: OrbitControls | null = null
  private firstPersonControls: FirstPersonControls | null = null
  private flyControls: FlyControls | null = null
  
  private currentViewMode: ViewMode = 'orbit'
  private animationId: number | null = null
  private clock: THREE.Clock
  private listeners: (() => void)[] = []
  private isRunning: boolean = false

  constructor(container: HTMLElement) {
    this.container = container
    this.clock = new THREE.Clock()

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a1628)
    this.scene.fog = new THREE.Fog(0x0a1628, 150, 300)

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(80, 70, 90)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    container.appendChild(this.renderer.domElement)

    this.setupControls()
    this.setupLights()
    this.setupGrid()
    this.handleResize = this.handleResize.bind(this)
    window.addEventListener('resize', this.handleResize)
  }

  private setupControls() {
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.orbitControls.enableDamping = true
    this.orbitControls.dampingFactor = 0.05
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
    this.orbitControls.minDistance = 10
    this.orbitControls.maxDistance = 250
    this.orbitControls.target.set(0, 2, 0)

    this.firstPersonControls = new FirstPersonControls(this.camera, this.renderer.domElement)
    this.firstPersonControls.movementSpeed = 15
    this.firstPersonControls.lookSpeed = 0.1
    this.firstPersonControls.activeLook = true
    this.firstPersonControls.enabled = false

    this.flyControls = new FlyControls(this.camera, this.renderer.domElement)
    this.flyControls.movementSpeed = 20
    this.flyControls.rollSpeed = 0.5
    this.flyControls.dragToLook = true
    this.flyControls.enabled = false
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
    this.scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(50, 60, 40)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 10
    mainLight.shadow.camera.far = 200
    mainLight.shadow.camera.left = -80
    mainLight.shadow.camera.right = 80
    mainLight.shadow.camera.top = 80
    mainLight.shadow.camera.bottom = -80
    mainLight.shadow.bias = -0.0001
    this.scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4)
    fillLight.position.set(-30, 30, -20)
    this.scene.add(fillLight)

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x2e3a4a, 0.3)
    this.scene.add(hemiLight)
  }

  private setupGrid() {
    const gridHelper = new THREE.GridHelper(100, 50, 0x2a4a6a, 0x1a3a5c)
    gridHelper.position.y = 0.01
    this.scene.add(gridHelper)

    const groundGeo = new THREE.PlaneGeometry(200, 200)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      roughness: 0.9,
      metalness: 0.1,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.scene.add(ground)
  }

  public setViewMode(mode: ViewMode) {
    this.currentViewMode = mode
    
    if (this.orbitControls) this.orbitControls.enabled = false
    if (this.firstPersonControls) this.firstPersonControls.enabled = false
    if (this.flyControls) this.flyControls.enabled = false

    switch (mode) {
      case 'orbit':
        if (this.orbitControls) this.orbitControls.enabled = true
        break
      case 'firstPerson':
        this.camera.position.y = 3
        if (this.firstPersonControls) {
          this.firstPersonControls.enabled = true
        }
        break
      case 'fly':
        if (this.flyControls) this.flyControls.enabled = true
        break
      case 'inspection':
        if (this.orbitControls) this.orbitControls.enabled = true
        break
    }
  }

  public getViewMode(): ViewMode {
    return this.currentViewMode
  }

  public setCameraPosition(x: number, y: number, z: number, targetX?: number, targetY?: number, targetZ?: number) {
    this.camera.position.set(x, y, z)
    if (this.orbitControls && targetX !== undefined && targetY !== undefined && targetZ !== undefined) {
      this.orbitControls.target.set(targetX, targetY, targetZ)
      this.orbitControls.update()
    }
  }

  public flyToPosition(x: number, y: number, z: number, targetX: number, targetY: number, targetZ: number, duration: number = 1500) {
    const startPos = this.camera.position.clone()
    const endPos = new THREE.Vector3(x, y, z)
    const startTarget = this.orbitControls?.target.clone() || new THREE.Vector3()
    const endTarget = new THREE.Vector3(targetX, targetY, targetZ)
    const startTime = performance.now()

    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      this.camera.position.lerpVectors(startPos, endPos, eased)
      if (this.orbitControls) {
        this.orbitControls.target.lerpVectors(startTarget, endTarget, eased)
        this.orbitControls.update()
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  public startAnimationLoop() {
    if (this.isRunning) return
    this.isRunning = true
    this.clock.start()
    this.animate()
  }

  public stopAnimationLoop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private animate() {
    if (!this.isRunning) return
    this.animationId = requestAnimationFrame(() => this.animate())

    const delta = this.clock.getDelta()

    if (this.orbitControls && this.currentViewMode === 'orbit') {
      this.orbitControls.update()
    }
    if (this.firstPersonControls && this.currentViewMode === 'firstPerson') {
      this.firstPersonControls.update(delta)
    }
    if (this.flyControls && this.currentViewMode === 'fly') {
      this.flyControls.update(delta)
    }

    this.listeners.forEach(fn => fn())
    this.renderer.render(this.scene, this.camera)
  }

  public onUpdate(fn: () => void) {
    this.listeners.push(fn)
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn)
    }
  }

  private handleResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  public raycast(screenX: number, screenY: number, objects: THREE.Object3D[]): THREE.Intersection[] {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const x = ((screenX - rect.left) / rect.width) * 2 - 1
    const y = -((screenY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera)
    return raycaster.intersectObjects(objects, true)
  }

  public dispose() {
    this.stopAnimationLoop()
    window.removeEventListener('resize', this.handleResize)
    
    this.orbitControls?.dispose()
    this.firstPersonControls?.dispose()
    this.flyControls?.dispose()

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose())
        } else {
          object.material.dispose()
        }
      }
    })

    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
  }
}
