// Minimal hash router: the page is chosen by the part after "#" in the address bar,
// e.g. index.html#/dashboard. No page reloads, no server rules needed.
export function parseHash() {
  const raw = window.location.hash.slice(1) || '/';
  const [path, query = ''] = raw.split('?');
  return { path: path || '/', params: new URLSearchParams(query), full: raw };
}

export function navigate(path, { replace = false } = {}) {
  const target = `#${path}`;
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange')); // same address: just re-render
  } else if (replace) {
    window.location.replace(target);
  } else {
    window.location.hash = path;
  }
}
