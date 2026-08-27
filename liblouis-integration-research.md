# Liblouis 점역 통합 기록

Sensory의 점자 스튜디오와 DotPad 프레임은 기존 임의 점자 셀 생성 대신 **Liblouis의 유니코드 점자 출력**을 단일 기준으로 사용한다. Liblouis는 다국어 문학 점자·컴퓨터 점자와 점역·역점역을 제공하는 오픈소스 엔진이며 LGPLv2.1+로 제공된다.[1] 현재 공식 릴리스는 3.38.0이다.[2]

| 항목 | 적용 기준 |
|---|---|
| 실행 경로 | 서버의 `lou_translate --forward unicode.dis,<table>` |
| 한국어 | `ko-g2.ctb` — Liblouis 최신 표의 한국어 2급 점자 테이블 |
| 영어 | `en-ueb-g2.ctb` — Unified English Braille 2급 테이블 |
| 출력 | 유니코드 점자 패턴(U+2800–U+28FF) |
| DotPad | 유니코드 점자 한 칸을 1–6번 점 배열로 변환한 뒤 기존 60×40 그래픽 프레임 생성기에 전달 |

공식 문서는 `lou_translate`가 표준 입력을 점역해 표준 출력으로 내보내며, `unicode.dis`를 테이블 목록의 첫 요소로 지정하면 유니코드 점자 패턴을 얻는다고 설명한다.[3] 최신 한국어 2급 표는 `ko.cti`, `ko-g2-rules.cti`를 포함하며, 표 메타데이터의 검증 상태는 별도 표 작성자 검증이 필요하다고 명시한다.[4] 따라서 앱은 결과를 표준 엔진 출력으로 표시하되, 교육·공식 시험 용도에서는 최신 한글점자규정과 당사자 검수를 병행한다.

공식 JavaScript 배포본은 브라우저와 Node를 지원하지만 현재 npm 배포 C-API가 3.2.0-rc인 점을 확인했다. 최신 표·엔진을 유지하기 위해 Sensory 배포 이미지에서 Liblouis 3.38.0을 컴파일하고 서버 절차로 호출한다. 정적 GitHub Pages는 이미 구성된 원격 tRPC API 주소를 통해 동일한 결과를 요청한다.

## References

[1] [Liblouis GitHub repository — introduction and LGPLv2.1+](https://github.com/liblouis/liblouis)

[2] [Liblouis 3.38.0 release assets](https://github.com/liblouis/liblouis/releases/tag/v3.38.0)

[3] [Liblouis manual — `lou_translate`](https://liblouis.io/documentation/liblouis/lou_005ftranslate-_0028program_0029.html)

[4] [Liblouis `ko-g2.ctb` — Korean Grade 2 table](https://raw.githubusercontent.com/liblouis/liblouis/master/tables/ko-g2.ctb)
