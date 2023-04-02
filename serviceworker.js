const staticCacheName = "staticFiles";

addEventListener("install", (installEvent) => {
  installEvent.waitUntil(
    caches.open(staticCacheName).then((staticCache) => {
      staticCache.addAll([
        //캐시 권장 파일
      ]);
      return staticCache.addAll([
        // 캐시 필수 파일
      ]);
    })
  );
});

addEventListener("activate", function (event) {
  console.log("서비스 워커를 활성화되었습니다.");
});

addEventListener("fetch", (fetchEvent) => {
  const request = fetchEvent.request;
  fetchEvent.respondWith(
    fetch(request)
      .then((responseFromFetch) => {
        return responseFromFetch;
      })
      .catch((error) => {
        return new Response("<h1>이런 !</h1> <p>뭔가가 잘못되었습니다.</p>", {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      })
  );
});
