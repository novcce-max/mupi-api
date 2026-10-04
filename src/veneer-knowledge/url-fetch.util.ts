function hostnameOf(url: URL): string {
  return url.hostname.toLowerCase();
}

/** 降低 SSRF 风险：仅 http(s)，禁 loopback / 常见内网（管理员接口仍应谨慎） */
export function isPublicHttpUrlForFetch(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const h = hostnameOf(u);
    if (
      h === 'localhost' ||
      h.endsWith('.localhost') ||
      h === '0.0.0.0' ||
      /^127\.\d+\.\d+\.\d+$/.test(h)
    ) {
      return false;
    }
    if (/^10\.\d+\.\d+\.\d+$/.test(h)) return false;
    if (/^192\.168\.\d+\.\d+$/.test(h)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)) return false;
    return true;
  } catch {
    return false;
  }
}
