# GitHub Pages CSS 복구 검증

P0 공개 페이지를 브라우저에서 열었을 때 GitHub Pages의 CSS 요청이 일시적으로 `503`을 반환해 학습지 본문이 비스타일 상태로 표시되는 현상을 재현했다. 같은 CSS URL은 이후 `200 text/css`로 응답했고, 원문은 216,766자·1,129개 규칙으로 정상 파싱됐다. 따라서 앱 CSS 자체의 구문 오류가 아니라 일시적 정적 자산 응답 실패로 판정했다.

`client/index.html`에는 빌드 결과가 추가하는 스타일시트 링크를 감시하는 가벼운 복구 로직을 추가했다. 링크의 `error` 이벤트가 발생하면 같은 CSS URL에 `css-retry=<timestamp>` 쿼리를 한 번 붙여 다시 요청한다. 이벤트 리스너는 `{ once: true }`로 등록하므로 반복 재시도나 무한 요청을 만들지 않는다.

| 항목 | 결과 |
|---|---|
| 원인 재현 | GitHub Pages `assets/index-CfQWXcuR.css` 요청에서 브라우저 503 로그 확인 |
| CSS 원문 확인 | `200 text/css`, 216,766자, 브라우저 재주입 시 1,129개 규칙 파싱 |
| 복구 동작 | 스타일시트 오류 시 단 한 번 캐시 우회 URL로 재요청 |
| 회귀 테스트 | HTML 복구 로직 정적 테스트 통과 |
| 전체 검증 | 21개 테스트 파일, 63개 테스트, TypeScript 검사, 프로덕션 빌드 통과 |

## 최신 공개 진단

2026-08-28 공개 페이지에서 `inspect-public-style.mjs`를 재실행했다. 문서는 `readyState: complete`였고, 빌드 스타일시트 `https://baekjunjoo.github.io/sensory/assets/index-D4TNJtNM.css`는 비활성화되지 않은 채 **1,128개 규칙**으로 파싱됐다. 원문을 브라우저의 임시 `<style>`에 재주입했을 때 **12개 최상위 규칙**을 확인했다. 공개 번들의 minified CSS가 최상위 `@layer`·중첩 규칙으로 구성되어 이 숫자는 전체 CSSOM 규칙 수와 다르지만, 원문 자체가 브라우저에서 파싱 가능함을 보여 준다.

같은 진단에서 `daily-arrival`은 `display: grid`, `position: relative`, 전경 `rgb(255, 255, 255)`로 계산됐고 `arrival-goal`은 `display: flex`로 계산됐다. 최신 공개 화면에서 3D 봉투 해변·촉각 목표·기존 주간 학습지 탭이 함께 렌더링되는 것도 확인했다.

회귀 테스트는 실제 HTML의 복구 스크립트를 jsdom에 실행해 스타일시트 `error` 이벤트를 발생시킨다. 첫 오류 뒤 `css-retry` 쿼리 URL이 적용되고, `{ once: true }` 리스너에 따라 두 번째 오류가 같은 URL을 다시 바꾸지 않는 것을 확인한다.

최종 검증에서는 이 런타임 모의 검사를 포함해 **23개 테스트 파일, 67개 테스트**와 TypeScript 검사·프로덕션 빌드를 모두 통과했다.

> 이 보완은 Pages의 일시적 자산 오류에 대한 표시 안정성 장치다. GitHub Pages 자체의 지속적인 5xx 장애는 클라이언트만으로 복구할 수 없으며, 해당 경우 공식 서비스 상태를 확인해야 한다.
