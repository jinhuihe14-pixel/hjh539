const CACHE_KEY = 'digital-twin-cache-v1'
const DATA_KEY = 'digital-twin-data-v1'

interface CacheEntry {
  url: string
  data: any
  timestamp: number
  expires: number
}

interface StoredData {
  devices: any[]
  warehouse: any[]
  lastUpdate: number
}

export class OfflineCache {
  private db: IDBDatabase | null = null
  private dbName: string = 'DigitalTwinCache'
  private storeName: string = 'resources'
  private initialized: boolean = false

  public async init(): Promise<void> {
    if (this.initialized) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.initialized = true
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  public async set(url: string, data: any, expires: number = 86400000): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const entry: CacheEntry = {
        url,
        data,
        timestamp: Date.now(),
        expires,
      }

      const request = store.put(entry)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  public async get(url: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(url)

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined
        if (!entry) {
          resolve(null)
          return
        }

        if (Date.now() - entry.timestamp > entry.expires) {
          this.delete(url)
          resolve(null)
          return
        }

        resolve(entry.data)
      }

      request.onerror = () => reject(request.error)
    })
  }

  public async delete(url: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(url)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  public async clearOld(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.openCursor()

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          const entry = cursor.value as CacheEntry
          if (Date.now() - entry.timestamp > entry.expires) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  public dispose() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
    this.initialized = false
  }
}

export function saveDataToLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(`${DATA_KEY}-${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

export function loadDataFromLocalStorage<T>(key: string, maxAge: number = 3600000): T | null {
  try {
    const stored = localStorage.getItem(`${DATA_KEY}-${key}`)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem(`${DATA_KEY}-${key}`)
      return null
    }

    return parsed.data as T
  } catch (e) {
    console.warn('Failed to load from localStorage:', e)
    return null
  }
}

export function saveSceneAnnotation(annotation: any): void {
  const annotations = loadSceneAnnotations()
  annotations.push({ ...annotation, id: `annot-${Date.now()}` })
  saveDataToLocalStorage('annotations', annotations)
}

export function loadSceneAnnotations(): any[] {
  return loadDataFromLocalStorage<any[]>('annotations') || []
}

export function isOnline(): boolean {
  return navigator.onLine
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
