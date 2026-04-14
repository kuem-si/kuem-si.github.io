import { SITE } from '../config/site';

export function toAbsoluteUrl(pathname: string): string {
  return new URL(pathname, SITE.url).toString();
}
