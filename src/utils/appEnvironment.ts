export function isRunningInInstalledAppOrWebView(): boolean {
  if (typeof window === 'undefined') return false;

  // PWA / Standalone / TWA ডিসপ্লে মোড যাচাই
  const isStandaloneDisplay =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (isStandaloneDisplay) return true;

  // Android TWA / অ্যাপ রেফারার যাচাই
  if (typeof document !== 'undefined' && document.referrer.startsWith('android-app://')) {
    return true;
  }

  // Android WebView ও APK র‍্যাপার User-Agent যাচাই
  const ua = window.navigator.userAgent || '';
  const isWebViewUA =
    /; wv\)/i.test(ua) ||
    /\bwv\b/i.test(ua) ||
    /WebIntoApp/i.test(ua) ||
    /WebViewGold|Appilix|AppsGeyser|AppMySite|Median|GoNative|Capacitor|Cordova|Crosswalk/i.test(
      ua
    ) ||
    (/Android/i.test(ua) && /Version\/[\d.]+.*Chrome\//i.test(ua));

  if (isWebViewUA) return true;

  // নেটিভ WebView ব্রিজ গ্লোবাল যাচাই
  const win = window as unknown as Record<string, unknown>;
  if (
    Boolean(win.ReactNativeWebView) ||
    Boolean(win.Capacitor) ||
    Boolean(win.cordova) ||
    Boolean(win.AndroidInterface) ||
    Boolean(win.WebIntoApp)
  ) {
    return true;
  }

  // ঐচ্ছিক URL প্যারামিটার (যেমন ?app=1 বা ?webview=1)
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('app') === '1' ||
      params.get('apk') === '1' ||
      params.get('webview') === '1' ||
      params.get('standalone') === '1'
    ) {
      return true;
    }
  } catch {
    // URL পার্সিং ত্রুটি উপেক্ষা করুন
  }

  return false;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // ক্লিপবোর্ড API ব্লক হলে ফ্যালব্যাক পদ্ধতি চেষ্টা করুন
    }
  }

  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
