// Queva Service Worker — v2 (offline caching + study alarm)
const CACHE = 'queva-v2'; // bumped — forces cache refresh for alarm fix
const OFFLINE_URL = '/QUEVA/';

const PRECACHE = [
  '/QUEVA/',
  '/QUEVA/index.html'
];

// ── Install: cache shell ──────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: clear old caches, re-arm alarm ─────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => _rearmAlarm())
  );
});

// ── Fetch: network-first, fallback to cache ───────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match(OFFLINE_URL)))
  );
});

// ══════════════════════════════════════════════════════════════
//  ALARM ENGINE
// ══════════════════════════════════════════════════════════════

// IndexedDB — survives SW restarts (localStorage not available in SW)
function _openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('queva-alarm-db', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('alarms', { keyPath: 'id' });
    req.onsuccess  = e => res(e.target.result);
    req.onerror    = ()  => rej(req.error);
  });
}
async function _saveAlarm(data) {
  const db = await _openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('alarms', 'readwrite');
    tx.objectStore('alarms').put({ id: 'active', ...data });
    tx.oncomplete = res;
    tx.onerror    = () => rej(tx.error);
  });
}
async function _getAlarm() {
  const db = await _openDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction('alarms', 'readonly');
    const req = tx.objectStore('alarms').get('active');
    req.onsuccess = () => res(req.result || null);
    req.onerror   = () => rej(req.error);
  });
}
async function _deleteAlarm() {
  const db = await _openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('alarms', 'readwrite');
    tx.objectStore('alarms').delete('active');
    tx.oncomplete = res;
    tx.onerror    = () => rej(tx.error);
  });
}

// Timer reference
let _alarmTimer = null;

async function _rearmAlarm() {
  if (_alarmTimer) { clearTimeout(_alarmTimer); _alarmTimer = null; }
  const alarm = await _getAlarm();
  if (!alarm) return;

  const delay = alarm.alarmTime - Date.now();
  if (delay <= 0) {
    await _fireAlarm(alarm.topic);
    return;
  }
  // Cap at 24h to keep timer precision reliable
  const safe = Math.min(delay, 86_400_000);
  _alarmTimer = setTimeout(async () => {
    const cur = await _getAlarm();
    if (cur && cur.alarmTime <= Date.now()) {
      await _fireAlarm(cur.topic);
    } else if (cur) {
      _rearmAlarm(); // woke too early — re-arm
    }
  }, safe);
}

async function _fireAlarm(topic) {
  await _deleteAlarm();

  // System notification — shows in OS notification tray
  await self.registration.showNotification('⏰ QUEVA Study Alarm', {
    body: `Time to study "${topic}" — tap to start your quiz.`,
    icon: '/QUEVA/icon-192.png',
    tag: 'queva-alarm',
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 600],
    data: { topic, scope: self.registration.scope }
  });

  // If a tab is already open, notify it immediately via postMessage
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const c of clients) {
    c.postMessage({ type: 'QUEVA_ALARM_FIRED', topic });
  }
}

// ── Message Handler (from main page JS) ──────────────────────
self.addEventListener('message', async e => {
  const { type } = e.data || {};

  if (type === 'ALARM_SET') {
    const { alarmTime, topic } = e.data;
    await _saveAlarm({ alarmTime, topic });
    await _rearmAlarm();
    e.source?.postMessage({ type: 'ALARM_CONFIRMED' });
  }

  if (type === 'ALARM_CANCEL') {
    await _deleteAlarm();
    if (_alarmTimer) { clearTimeout(_alarmTimer); _alarmTimer = null; }
  }

  if (type === 'ALARM_REARM') {
    // Called on every page load to re-arm timer after SW restart
    await _rearmAlarm();
  }
});

// ── Notification tap → open/focus QUEVA tab ──────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const { topic, scope } = e.notification.data;

  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        for (const c of list) {
          if (c.url.startsWith(scope) && 'focus' in c) {
            c.postMessage({ type: 'QUEVA_ALARM_FIRED', topic });
            return c.focus();
          }
        }
        // No open tab — open one with alarm param
        return self.clients.openWindow(scope + '?alarm=' + encodeURIComponent(topic));
      })
  );
});
