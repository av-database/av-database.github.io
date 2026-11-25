const EVENT_NAME = "avdb:nav-reset";

// ヘッダーからの遷移でリセット対象になったルート。
// Activity で非表示中のページは effect がクリーンアップされイベントを受け取れないため、
// モジュール変数に保持して再表示時の effect から消費する。
let pendingRoute: string | null = null;

export function requestNavReset(route: string): void {
  pendingRoute = route;
  window.dispatchEvent(new CustomEvent<string>(EVENT_NAME, { detail: route }));
}

export function subscribeNavReset(route: string, onReset: () => void): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<string>).detail;
    if (detail !== route) return;
    pendingRoute = null;
    onReset();
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

export function consumeNavReset(route: string): boolean {
  if (pendingRoute === route) {
    pendingRoute = null;
    return true;
  }
  return false;
}
