const KEYWORDS: Record<string, string[]> = {
  JavaScript: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'async', 'await', 'import', 'export', 'from', 'class', 'new'],
  TypeScript: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'async', 'await', 'import', 'export', 'from', 'class', 'new', 'interface', 'type'],
  Python: ['def', 'class', 'return', 'if', 'else', 'elif', 'import', 'from', 'async', 'await', 'with', 'as'],
  Java: ['public', 'private', 'class', 'void', 'return', 'if', 'else', 'new', 'static', 'import'],
  'C++': ['int', 'void', 'class', 'return', 'if', 'else', 'public', 'private', 'include', 'using', 'namespace'],
  Go: ['func', 'package', 'import', 'return', 'if', 'else', 'var', 'const', 'type', 'struct'],
  CSS: ['color', 'background', 'display', 'flex', 'margin', 'padding', 'border', 'font'],
};

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightLine(line: string, language: string) {
  let result = escapeHtml(line);
  const kws = KEYWORDS[language] ?? KEYWORDS.JavaScript;
  kws.forEach((kw) => {
    result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span class="hl-keyword">$1</span>');
  });
  result = result.replace(/('[^']*'|"[^"]*"|`[^`]*`)/g, '<span class="hl-string">$1</span>');
  result = result.replace(/(\/\/.*$|#.*$)/g, '<span class="hl-comment">$1</span>');
  result = result.replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');
  return result;
}

type Props = { code: string; language: string };

const SyntaxHighlight = ({ code, language }: Props) => (
  <pre className="code-block syntax-highlight">
    <code>
      {code.split('\n').map((line, i) => (
        <div key={i} className="code-line">
          <span className="line-num">{i + 1}</span>
          <span dangerouslySetInnerHTML={{ __html: highlightLine(line, language) || '&nbsp;' }} />
        </div>
      ))}
    </code>
  </pre>
);

export default SyntaxHighlight;
