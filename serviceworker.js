const version = "v0.05";
const staticCacheName = version + "staticFiles";
const imageCacheName = "images";

const cacheList = [staticCacheName, imageCacheName];

addEventListener("install", (installEvent) => {
  installEvent.waitUntil(
    caches.open(staticCacheName).then((staticCache) => {
      staticCache.addAll([
        //캐시 권장 파일
      ]);
      return staticCache.addAll([
        // 캐시 필수 파일
        "/path/to/stylesheet.css",
        "/path/to/javscript.js",
        "/offline.html",
        "/fallback.svg",
      ]);
    })
  );
});

addEventListener("activate", (activateEvent) => {
  activateEvent.waitUntil(
    // 기존 캐 정리하기
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheList.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 모든 탭의 페이지까지 즉시 제어함
        return clients.claim();
      })
  );
});

addEventListener("fetch", (fetchEvent) => {
  const request = fetchEvent.request;
  if (request.headers.get("Accept").includes("text/html")) {
    fetchEvent.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }
  if (request.headers.get("Accept").includes("image")) {
    fetchEvent.respondWith(
      caches.match(request).then((responseFromCache) => {
        if (responseFromCache) {
          fetchEvent.waitUntil(
            fetch(request).then((responseFromFetch) => {
              caches.open(imageCacheName).then((imageCache) => {
                return imageCache.put(request, responseFromFetch);
              });
            })
          );
          return responseFromCache;
        }
        return fetch(request)
          .then((responseFromFetch) => {
            const copy = responseFromFetch.clone();
            fetchEvent.waitUntil(
              caches.open(imageCacheName).then((imageCache) => {
                return imageCache.put(request, copy);
              })
            );
            return responseFromFetch;
          })
          .catch((error) => caches.match("/fallback.svg"));
      })
    );
    return;
  }
  fetchEvent.respondWith(
    caches.match(request).then((responseFromCache) => {
      if (responseFromCache) {
        return responseFromCache;
      }
      return fetch(request);
    })
  );
});
