export function renderMarkdown(text: string, onLinkClick?: (title: string) => void): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/\[\[([^\]]+)\]\]/g, (_, title) =>
    `<a href="#" class="wiki-link" data-wiki-link="${title}">${title}</a>`
  );
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  return html;
}

export function highlightMentions(text: string): string {
  return text.replace(/@(\w+(?:\s+\w+)?)/g, '<span class="mention">@$1</span>');
}
