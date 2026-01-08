/**
 * 간단한 마크다운을 HTML로 변환하는 함수
 */
function markdownToHtml(markdown) {
  return markdown
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*)\*/gim, "<em>$1</em>")
    .replace(/\n\n/gim, "</p><p>")
    .replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>")
    .replace(/<\/ul>\s*<ul>/gim, "")
    .replace(/^(?!<[hul])/gim, "<p>")
    .replace(/(?<![>])\n$/gim, "</p>");
}

export { markdownToHtml };
