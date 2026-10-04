/** 轻量 HTML → 纯文本（MVP，无额外依赖） */
export function htmlToPlainText(html: string): string {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  t = t.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<\/p>/gi, '\n');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t.replace(/&nbsp;/gi, ' ');
  t = t.replace(/&amp;/gi, '&');
  t = t.replace(/&lt;/gi, '<');
  t = t.replace(/&gt;/gi, '>');
  t = t.replace(/&quot;/gi, '"');
  t = t.replace(/&#(\d+);/g, (_, n) => {
    const code = Number(n);
    return Number.isFinite(code) ? String.fromCharCode(code) : '';
  });
  t = t.replace(/\s+/g, ' ');
  return t.trim();
}
