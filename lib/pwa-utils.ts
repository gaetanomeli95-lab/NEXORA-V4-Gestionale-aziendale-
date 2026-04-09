export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export class PWAUtils {
  private static deferredPrompt: PWAInstallPrompt | null = null
  private static installButton: HTMLElement | null = null

  static initialize() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      this.deferredPrompt = e as any
      // Show the install button
      this.showInstallButton()
    })

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      // Hide the install button
      this.hideInstallButton()
      this.deferredPrompt = null
    })

    // Check if app is already installed
    this.checkInstalledStatus()
  }

  private static showInstallButton() {
    // Remove existing button if any
    this.hideInstallButton()

    // Create install button
    const button = document.createElement('button')
    button.innerHTML = `
      <div class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        <span>Installa App</span>
      </div>
    `
    button.className = 'fixed bottom-20 right-4 z-50 shadow-xl'
    button.onclick = () => this.installApp()

    document.body.appendChild(button)
    this.installButton = button
  }

  private static hideInstallButton() {
    if (this.installButton) {
      this.installButton.remove()
      this.installButton = null
    }
  }

  static async installApp() {
    if (!this.deferredPrompt) {
      return
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      // Clear the deferred prompt
      this.deferredPrompt = null
      this.hideInstallButton()
    } catch (error) {
      console.error('Error during app installation:', error)
    }
  }

  private static checkInstalledStatus() {
    // Check if the app is running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches

    if (isStandalone || isInWebAppiOS || isInWebAppChrome) {
      console.log('App is running in standalone mode')
      this.hideInstallButton()
    }
  }

  // Service Worker registration
  static async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.showUpdateButton()
              }
            })
          }
        })
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  private static showUpdateButton() {
    const button = document.createElement('button')
    button.innerHTML = `
      <div class="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <span>Aggiorna App</span>
      </div>
    `
    button.className = 'fixed bottom-20 right-4 z-50 shadow-xl'
    button.onclick = () => this.updateApp()

    document.body.appendChild(button)
  }

  private static updateApp() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister()
        })
      })
    }
    window.location.reload()
  }

  // Push notification subscription
  static async subscribeToPushNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
        })

        console.log('Push notification subscription:', subscription)
        
        // Send subscription to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        })

        return subscription
      } catch (error) {
        console.error('Push subscription failed:', error)
      }
    }
  }

  private static urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  }

  // Check if app is installed
  static isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true
  }

  // Get device info
  static getDeviceInfo() {
    return {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768,
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio
    }
  }

  // Network status monitoring
  static monitorNetworkStatus() {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine
      const statusElement = document.getElementById('network-status')
      
      if (statusElement) {
        statusElement.className = isOnline 
          ? 'fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-1 text-xs z-50'
          : 'fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-1 text-xs z-50'
        statusElement.textContent = isOnline ? 'Online' : 'Offline'
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    updateOnlineStatus()
  }

  // App lifecycle events
  static setupAppLifecycle() {
    // Handle app visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('App is hidden')
        // Pause background tasks
      } else {
        console.log('App is visible')
        // Resume background tasks
        // Refresh data
      }
    })

    // Handle page unload
    window.addEventListener('beforeunload', (e) => {
      // Save any unsaved data
      console.log('App is about to close')
    })
  }
}
