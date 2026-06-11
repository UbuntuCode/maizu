/*
 * Maizu middleware — passthrough only.
 * No auth redirects here. Pages handle their own auth guards.
 */
export function middleware() {
  /* Do nothing — let all routes pass through */
}

export const config = {
  matcher: [],
};
