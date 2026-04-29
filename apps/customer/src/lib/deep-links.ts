import { App, type URLOpenListenerEvent } from "@capacitor/app";

export function setupDeepLinkHandler(onDeepLink: (path: string) => void): () => void {
  const handle = (url: string) => {
    try {
      const u = new URL(url);
      const path = `/${u.host}${u.pathname}${u.search}`;
      console.log("[deep-link]", url, "->", path);
      onDeepLink(path);
    } catch (e) {
      console.error("[deep-link] failed to parse:", url, e);
    }
  };

  // 1. Handle deep links that arrive while the app is already running
  let removeListener: (() => void) | null = null;
  App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
    handle(event.url);
  }).then((h) => {
    removeListener = () => h.remove();
  });

  // 2. Handle the URL that launched the app from a cold start
  App.getLaunchUrl()
    .then((result) => {
      if (result?.url) {
        console.log("[deep-link] cold start URL:", result.url);
        handle(result.url);
      }
    })
    .catch((e) => {
      console.error("[deep-link] getLaunchUrl failed:", e);
    });

  return () => {
    if (removeListener) removeListener();
  };
}