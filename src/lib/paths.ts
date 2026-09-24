export function withBase(path: string): string {
  if (
    /^(https?:)?\/\//.test(path) ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:") ||
    path.startsWith("#")
  ) {
    return path;
  }

  const baseUrl = import.meta.env.BASE_URL ?? "/";
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = ensureTrailingSlash(path);
  return `${base}${normalizedPath}` || "/";
}

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

/** Apply the site's directory URL convention to a local page URL. */
export function ensureTrailingSlash(path: string): string {
  if (
    /^(https?:)?\/\//.test(path) ||
    /^(mailto:|tel:|javascript:)/i.test(path) ||
    path.startsWith("#")
  ) {
    return path;
  }

  const splitAt = path.search(/[?#]/);
  const pathname = splitAt < 0 ? path : path.slice(0, splitAt);
  const suffix = splitAt < 0 ? "" : path.slice(splitAt);
  const normalizedPath = `/${pathname.replace(/^\/+/, "")}`;
  const isFile = /\.[^/]+$/.test(normalizedPath);
  const directoryPath =
    normalizedPath === "/" || isFile
      ? normalizedPath
      : `${normalizedPath.replace(/\/+$/, "")}/`;
  return `${directoryPath}${suffix}`;
}
