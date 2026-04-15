export function stripHtml(html: string): string {
  if (!html) return '';
  // Simple regex to strip HTML tags
  const stripped = html.replace(/<[^>]*>?/gm, ' ');
  // Decode common HTML entities
  return stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
