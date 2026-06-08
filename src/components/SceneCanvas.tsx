import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { SceneEngine } from '../engine/SceneEngine'
import { SceneManager } from '../engine/SceneManager'
import { useDeviceStore } from '../store/deviceStore'
import { useSceneStore } from '../store/sceneStore'
import { useMaintenanceStore } from '../store/maintenanceStore'
import { useAnnotationStore } from '../store/annotationStore'
import { useInspectionStore } from '../store/inspectionStore'
import { useRecordingStore } from '../store/recordingStore'
import { ViewControls } from './ViewControls'
import { SimulationControls } from './SimulationControls'
import { captureScreenshotWithWatermark } from '../utils/exportUtils'

interface SceneCanvasProps {
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
}

export function SceneCanvas({ onCanvasReady }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<SceneEngine | null>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0, z: 0 })
  const [cameraTarget, setCameraTarget] = useState({ x: 0, y: 0, z: 0 })
  
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
  
  const { orderList, initMockData: initMaintenanceData } = useMaintenanceStore()
  const { 
    annotations, 
    isAddingAnnotation, 
    addingType, 
    setAddingMode,
    addAnnotation,
    selectAnnotation,
  } = useAnnotationStore()
  const { 
    selectedRouteId, 
    isPatrolling, 
    currentPatrolPointIndex,
    routeList,
    getCurrentPatrolPoint,
    advancePatrolPoint,
  } = useInspectionStore()
  
  const { isRecording, addFrame, recordedFrames, recordingStartTime } = useRecordingStore()

  useEffect(() => {
    initWarehouseData()
    initCameraData()
    initPipeData()
    initMaintenanceData()
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
      
      sceneManager.animateAnnotations(performance.now() / 1000)

      const cam = engine.camera
      setCameraPos({ x: cam.position.x, y: cam.position.y, z: cam.position.z })
      if (engine['orbitControls']) {
        const target = (engine as any).orbitControls?.target
        if (target) {
          setCameraTarget({ x: target.x, y: target.y, z: target.z })
        }
      }

      if (isRecording && engineRef.current) {
        const frameInterval = 2000
        const elapsed = Date.now() - recordingStartTime
        const expectedFrames = Math.floor(elapsed / frameInterval)
        
        if (recordedFrames.length < expectedFrames) {
          const frame = {
            timestamp: Date.now(),
            cameraPosition: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
            cameraTarget: {
              x: (engine as any).orbitControls?.target.x || 0,
              y: (engine as any).orbitControls?.target.y || 0,
              z: (engine as any).orbitControls?.target.z || 0,
            },
            deviceStates: deviceList.map(d => ({
              deviceId: d.id,
              status: d.status,
              parameters: d.parameters.map(p => ({ name: p.name, value: p.value })),
            })),
          }
          addFrame(frame)
        }
      }

      if (isPatrolling && sceneManagerRef.current && engineRef.current) {
        const currentPoint = getCurrentPatrolPoint()
        if (currentPoint) {
          const dist = cam.position.distanceTo(
            new THREE.Vector3(currentPoint.position.x, currentPoint.position.y, currentPoint.position.z)
          )
          if (dist < 1) {
            setTimeout(() => {
              if (isPatrolling) {
                advancePatrolPoint()
              }
            }, (currentPoint.stayDuration || 30) * 1000)
          }
        }
      }
    })

    const handleClick = (event: MouseEvent) => {
      if (!sceneManagerRef.current || !engineRef.current) return
      
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      if (isAddingAnnotation) {
        const interactiveObjects = sceneManagerRef.current.getAnnotationObjects()
        const intersections = engineRef.current.raycast(
          event.clientX,
          event.clientY,
          interactiveObjects
        )
        if (intersections.length > 0) {
          let obj: THREE.Object3D | null = intersections[0].object
          while (obj) {
            if (obj.userData.annotationId) {
              selectAnnotation(obj.userData.annotationId)
              break
            }
            obj = obj.parent
          }
        } else {
          const groundObjects: THREE.Object3D[] = []
          const ground = engineRef.current.scene.getObjectByName('ground')
          if (ground) groundObjects.push(ground)
          
          const rayIntersections = engineRef.current.raycast(
            event.clientX,
            event.clientY,
            groundObjects
          )
          
          if (rayIntersections.length > 0 && addingType) {
            const point = rayIntersections[0].point
            addAnnotation({
              position: { x: point.x, y: point.y, z: point.z },
              type: addingType,
              title: '新标注',
              content: '',
              author: '当前用户',
              resolved: false,
            })
            setAddingMode(false)
          }
        }
        return
      }

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

    if (onCanvasReady) {
      onCanvasReady(engine.getCanvas())
    }

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

  useEffect(() => {
    if (sceneManagerRef.current && orderList.length > 0) {
      const deviceMaintenanceMap = new Map<string, 'pending' | 'inProgress' | 'completed'>()
      
      orderList.forEach(order => {
        if (!deviceMaintenanceMap.has(order.deviceId)) {
          deviceMaintenanceMap.set(order.deviceId, order.status)
        } else {
          const priority = ['pending', 'inProgress', 'completed']
          const current = deviceMaintenanceMap.get(order.deviceId)!
          if (priority.indexOf(order.status) < priority.indexOf(current)) {
            deviceMaintenanceMap.set(order.deviceId, order.status)
          }
        }
      })

      deviceMaintenanceMap.forEach((status, deviceId) => {
        sceneManagerRef.current?.updateMaintenanceStatus(deviceId, status)
      })
    }
  }, [orderList])

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAnnotations(annotations)
    }
  }, [annotations])

  useEffect(() => {
    if (sceneManagerRef.current && selectedRouteId) {
      const route = routeList.find(r => r.id === selectedRouteId)
      if (route) {
        sceneManagerRef.current.showInspectionRoute(route)
      }
    } else if (sceneManagerRef.current && !selectedRouteId) {
      sceneManagerRef.current.clearInspectionRoute()
    }
  }, [selectedRouteId, routeList])

  useEffect(() => {
    if (sceneManagerRef.current && isPatrolling) {
      const currentPoint = getCurrentPatrolPoint()
      if (currentPoint) {
        sceneManagerRef.current.highlightCurrentInspectionPoint(currentPoint.id)
        
        if (engineRef.current) {
          engineRef.current.flyToPosition(
            currentPoint.position.x,
            currentPoint.position.y,
            currentPoint.position.z,
            currentPoint.target.x,
            currentPoint.target.y,
            currentPoint.target.z,
            2000
          )
        }
      }
    }
  }, [currentPatrolPointIndex, isPatrolling])

  const handleScreenshot = useCallback(() => {
    if (engineRef.current) {
      const canvas = engineRef.current.getCanvas()
      captureScreenshotWithWatermark(canvas, '数字孪生工厂 - 内部存档')
    }
  }, [])

  return (
    <div className="scene-canvas-container">
      <div ref={containerRef} className="scene-canvas" />
      {isLoading && (
        <div className="loading-indicator">场景加载中...</div>
      )}
      <ViewControls />
      <SimulationControls onScreenshot={handleScreenshot} />
      
      {isAddingAnnotation && (
        <div className="adding-hint">
          点击场景地面添加{addingType}标注，或点击已有标注查看
        </div>
      )}
    </div>
  )
}
