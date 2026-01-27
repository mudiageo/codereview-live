/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => {
				self.skipWaiting();
			})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE) await caches.delete(key);
			}
			self.clients.claim();
		})
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		caches.match(event.request).then((response) => {
			if (response) return response;

			return fetch(event.request).then((response) => {
				if (!response || response.status !== 200 || response.type !== 'basic') {
					return response;
				}

				const responseToCache = response.clone();
				caches.open(CACHE).then((cache) => {
					cache.put(event.request, responseToCache);
				});

				return response;
			});
		})
	);
});

// Push notification event
self.addEventListener('push', (event) => {
	if (!event.data) return;

	const data = event.data.json();
	const options = {
		body: data.body,
		icon: '/icon-192.png',
		badge: '/icon-72.png',
		data: data.url,
		actions: data.actions
	};

	event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	if (event.notification.data) {
		event.waitUntil(clients.openWindow(event.notification.data));
	}
});
