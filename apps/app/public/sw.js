const CACHE_NAME = "sitecue-app-shell-v4";
const STATIC_ASSETS = [
	"/",
	"/notes",
	"/logo.svg",
	"/icon.ico",
	"/apple-icon.png",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_NAME)
						.map((key) => caches.delete(key)),
				),
			),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;

	const url = new URL(event.request.url);
	if (
		url.pathname.startsWith("/api/") ||
		url.pathname.startsWith("/auth/") ||
		url.pathname.endsWith(".webmanifest")
	) {
		return;
	}

	const isDocument =
		event.request.mode === "navigate" ||
		event.request.headers.get("accept")?.includes("text/html");

	if (isDocument) {
		event.respondWith(
			fetch(event.request)
				.then((networkResponse) => {
					if (networkResponse && networkResponse.status === 200) {
						const responseToCache = networkResponse.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseToCache);
						});
					}
					return networkResponse;
				})
				.catch(() => {
					return caches.match(event.request).then((cachedResponse) => {
						return cachedResponse || caches.match("/");
					});
				}),
		);
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			const fetchPromise = fetch(event.request)
				.then((networkResponse) => {
					if (networkResponse && networkResponse.status === 200) {
						const responseToCache = networkResponse.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseToCache);
						});
					}
					return networkResponse;
				})
				.catch(() => cachedResponse);

			return cachedResponse || fetchPromise;
		}),
	);
});
