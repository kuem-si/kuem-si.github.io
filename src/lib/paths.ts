export function withBase(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith("mailto:") || path.startsWith("tel:") || path.startsWith("#")) {
    return path;
  }

  const baseUrl = import.meta.env.BASE_URL ?? "/";
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/+/, "")}`;
  return `${base}${normalizedPath}` || "/";
}

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}
