import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { SceneEngine } from '../engine/SceneEngine'
import { SceneManager } from '../engine/SceneManager'
import { useDeviceStore } from '../store/deviceStore'
import { useSceneStore } from '../store/sceneStore'
import { ViewControls } from './ViewControls'
import { SimulationControls } from './SimulationControls'

export function SceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<SceneEngine | null>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const { deviceList, selectDevice, selectedDeviceId, startDataSimulation, stopDataSimulation } = useDeviceStore()
  const { 
    viewMode, 
    setViewMode,
    isSimulationRunning, 
    simulationSpeed,
    warehouseSlots,
    cameras,
    pipeNodes,
    initWarehouseData,
    initCameraData,
    initPipeData,
    showPipes,
    showCameras,
  } = useSceneStore()

  useEffect(() => {
    initWarehouseData()
    initCameraData()
    initPipeData()
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    if (warehouseSlots.length === 0 || cameras.length === 0 || pipeNodes.length === 0) return

    const engine = new SceneEngine(containerRef.current)
    engineRef.current = engine

    const sceneManager = new SceneManager(engine)
    sceneManagerRef.current = sceneManager

    sceneManager.initScene(deviceList, warehouseSlots, cameras, pipeNodes)
    engine.startAnimationLoop()

    engine.onUpdate(() => {
      const delta = 1 / 60
      sceneManager.update(delta, isSimulationRunning, simulationSpeed)
    })

    const handleClick = (event: MouseEvent) => {
      if (!sceneManagerRef.current || !engineRef.current) return
      
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const interactiveObjects = sceneManagerRef.current.getInteractiveObjects()
      const intersections = engineRef.current.raycast(
        event.clientX,
        event.clientY,
        interactiveObjects
      )

      if (intersections.length > 0) {
        let obj: THREE.Object3D | null = intersections[0].object
        while (obj) {
          if (obj.userData.deviceId) {
            selectDevice(obj.userData.deviceId)
            break
          }
          obj = obj.parent
        }
      } else {
        selectDevice(null)
      }
    }

    containerRef.current.addEventListener('click', handleClick)
    setIsLoading(false)
    startDataSimulation()

    return () => {
      containerRef.current?.removeEventListener('click', handleClick)
      stopDataSimulation()
      sceneManager.dispose()
      engine.dispose()
    }
  }, [warehouseSlots.length, cameras.length, pipeNodes.length])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setViewMode(viewMode)
    }
  }, [viewMode])

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.togglePipes(showPipes)
    }
  }, [showPipes])

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.toggleCameras(showCameras)
    }
  }, [showCameras])

  useEffect(() => {
    if (sceneManagerRef.current && deviceList.length > 0) {
      deviceList.forEach(device => {
        sceneManagerRef.current?.updateDeviceStatus(device.id, device.status)
      })
    }
  }, [deviceList])

  return (
    <div className="scene-canvas-container">
      <div ref={containerRef} className="scene-canvas" />
      {isLoading && (
        <div className="loading-indicator">场景加载中...</div>
      )}
      <ViewControls />
      <SimulationControls />
    </div>
  )
}
