export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

export function exportToJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, filename)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface ScreenshotOptions {
  filename?: string
  watermark?: string
  showTimestamp?: boolean
  timestampFormat?: string
  watermarkColor?: string
  watermarkFontSize?: number
}

export function captureScreenshot(canvas: HTMLCanvasElement, options: ScreenshotOptions = {}) {
  const {
    filename = 'screenshot.png',
    watermark = '',
    showTimestamp = false,
    watermarkColor = 'rgba(255, 255, 255, 0.6)',
    watermarkFontSize = 14,
  } = options

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const ctx = tempCanvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(canvas, 0, 0)

  const lines: string[] = []
  if (watermark) {
    lines.push(watermark)
  }
  if (showTimestamp) {
    lines.push(new Date().toLocaleString('zh-CN'))
  }

  if (lines.length > 0) {
    ctx.font = `${watermarkFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    ctx.fillStyle = watermarkColor
    ctx.textBaseline = 'bottom'
    ctx.textAlign = 'right'

    const padding = 15
    const lineHeight = watermarkFontSize + 6
    const startY = canvas.height - padding

    lines.reverse().forEach((line, index) => {
      const y = startY - index * lineHeight
      ctx.fillText(line, canvas.width - padding, y)
    })
  }

  tempCanvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, filename)
    }
  }, 'image/png')
}

export function captureScreenshotWithTimestamp(canvas: HTMLCanvasElement, filename?: string) {
  return captureScreenshot(canvas, {
    filename: filename || `screenshot_${Date.now()}.png`,
    showTimestamp: true,
  })
}

export function captureScreenshotWithWatermark(
  canvas: HTMLCanvasElement,
  watermark: string,
  filename?: string
) {
  return captureScreenshot(canvas, {
    filename: filename || `screenshot_${Date.now()}.png`,
    watermark,
    showTimestamp: true,
  })
}

export class ScreenRecorder {
  private stream: MediaStream | null = null
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  public async start(): Promise<void> {
    try {
      this.stream = (this.canvas as any).captureStream(60)
      if (!this.stream) {
        throw new Error('Failed to capture stream from canvas')
      }
      this.recorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm;codecs=vp9',
      })
      
      this.chunks = []
      this.recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data)
        }
      }

      this.recorder.start()
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  public stop(filename: string = 'recording.webm'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error('Recorder not started'))
        return
      }

      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' })
        downloadBlob(blob, filename)
        this.cleanup()
        resolve()
      }

      this.recorder.stop()
    })
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.recorder = null
    this.chunks = []
  }

  public isRecording(): boolean {
    return this.recorder?.state === 'recording'
  }
}

export function generateDeviceReport(devices: any[]): any {
  const total = devices.length
  const normal = devices.filter(d => d.status === 'normal').length
  const fault = devices.filter(d => d.status === 'fault').length
  const standby = devices.filter(d => d.status === 'standby').length
  const maintenance = devices.filter(d => d.status === 'maintenance').length

  const oee = total > 0 ? ((normal + standby) / total * 100).toFixed(1) : '0'

  return {
    reportTime: new Date().toISOString(),
    summary: {
      total,
      normal,
      fault,
      standby,
      maintenance,
      oee: `${oee}%`,
    },
    devices,
  }
}
