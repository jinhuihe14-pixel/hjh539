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

export function captureScreenshot(canvas: HTMLCanvasElement, filename: string = 'screenshot.png') {
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, filename)
    }
  }, 'image/png')
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
