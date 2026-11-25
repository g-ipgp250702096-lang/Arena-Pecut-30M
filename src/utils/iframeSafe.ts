const memoryStorage = new Map<string, string>();

function getNativeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    const storage = window.localStorage;
    if (!storage) return null;
    const probeKey = '__arena_pecut_probe__';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return null;
  }
}

export function safeStorageGet(key: string): string | null {
  try {
    const storage = getNativeLocalStorage();
    if (storage) {
      return storage.getItem(key);
    }
  } catch {
    // Fall back to in-memory storage when embedded in restricted iframes
  }
  return memoryStorage.get(key) ?? null;
}

export function safeStorageSet(key: string, value: string): void {
  memoryStorage.set(key, value);
  try {
    const storage = getNativeLocalStorage();
    if (storage) {
      storage.setItem(key, value);
    }
  } catch {
    // Ignore storage quota or SecurityError in sandboxed/cross-origin iframes
  }
}

export function safeStorageRemove(key: string): void {
  memoryStorage.delete(key);
  try {
    const storage = getNativeLocalStorage();
    if (storage) {
      storage.removeItem(key);
    }
  } catch {
    // Ignore SecurityError in sandboxed/cross-origin iframes
  }
}

export function safeScrollToTop(): void {
  try {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch {
    try {
      window.scrollTo(0, 0);
    } catch {
      // Ignore if scrolling is restricted inside host iframe
    }
  }
}

export function isInIframe(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return window.self !== window.top;
  } catch {
    // Cross-origin access to window.top throws SecurityError when embedded
    return true;
  }
}

export function safePrint(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.print !== 'function') {
      return false;
    }
    window.print();
    return true;
  } catch {
    return false;
  }
}

export function safeDownloadBlob(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 1000);
    return true;
  } catch {
    return false;
  }
}
