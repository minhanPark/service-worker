const version = "v0.05";
const staticCacheName = version + "staticFiles";
const imageCacheName = "images";
const pagesCacheName = "pages";

const cacheList = [staticCacheName, imageCacheName, pagesCacheName];

addEventListener("install", (installEvent) => {
  installEvent.waitUntil(
    caches.open(staticCacheName).then((staticCache) => {
      staticCache.addAll([
        //캐시 권장 파일
      ]);
      return staticCache.addAll([
        // 캐시 필수 파일
        // "/path/to/stylesheet.css",
        // "/path/to/javscript.js",
        "/offline.html",
        // "/fallback.svg",
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
      fetch(request)
        .then((responseFromFetch) => {
          const copy = responseFromFetch.clone();
          fetchEvent.waitUntil(
            caches.open(pagesCacheName).then((pagesCache) => {
              return pagesCache.put(request, copy);
            })
          );
          return responseFromFetch;
        })
        .catch((error) =>
          caches.match("request").then((responseFromCache) => {
            if (responseFromCache) {
              return responseFromCache;
            }
            return caches.match("/offline.html");
          })
        )
    );
    return;
  }
  if (request.headers.get("Accept").includes("image")) {
    fetchEvent.respondWith(
      caches.match(request).then((responseFromCache) => {
        if (responseFromCache) {
          fetchEvent.waitUntil(stashInCache(request, imageCacheName));
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

function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
  });
}

addEventListener("message", (messageEvent) => {
  if (messageEvent.data === "캐시 정리하기") {
    trimCache(pagesCacheName, 20);
    trimCache(imageCacheName, 50);
  }
});

async function stashInCache(request, cacheName) {
  const responseFromFetch = await fetch(request);
  const theCache = await caches.open(cacheName);
  return await theCache.put(request, responseFromFetch);
}
