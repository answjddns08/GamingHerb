/**
 * 게임 설명을 마크다운 파일에서 읽어오는 함수
 */
export async function getGameDescription() {
  try {
    const response = await fetch("/src/games/AnotherTestGame/README.md");
    const markdown = await response.text();

    // 간단한 마크다운 to HTML 변환
    return markdownToHtml(markdown);
  } catch (error) {
    console.error("마크다운 파일 로드 실패:", error);

    // 기본 설명 반환
    return `
      <h2>테스트 게임</h2>
      <p>이 게임은 다양한 기능을 테스트하기 위한 샘플 게임입니다.</p>

      <h3>테스트 기능</h3>
      <ul>
        <li>점수 시스템</li>
        <li>버튼 인터랙션</li>
        <li>상태 관리</li>
        <li>UI 컴포넌트</li>
      </ul>

      <h3>사용법</h3>
      <p>버튼을 클릭하여 다양한 기능을 테스트해보세요.</p>
    `;
  }
}

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

/**
 * 테스트 게임 유틸리티 함수들
 */
export class TestGameUtils {
  static formatScore(score) {
    return score.toLocaleString();
  }

  static generateRandomScore() {
    return Math.floor(Math.random() * 100) + 1;
  }

  static validateScore(score) {
    return score >= 0 && score <= 10000;
  }

  static getScoreGrade(score) {
    if (score >= 500) return "S";
    if (score >= 300) return "A";
    if (score >= 200) return "B";
    if (score >= 100) return "C";
    return "D";
  }
}
