/**
 * Screens that render outside the authenticated shell. `proxy.ts` lets them through without a
 * session and the shell components (`Header`, `Sidebar`) skip rendering on them — kept in one
 * list so adding a public screen cannot leave the shell half-hidden.
 */
export const PUBLIC_PATHS: readonly string[] = ["/login", "/register"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}
