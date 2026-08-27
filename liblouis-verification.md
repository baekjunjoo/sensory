# Liblouis 점역 및 카드 장식 검증

로컬 Liblouis 3.29.0의 `lou_translate`로 한국어 `센서리`를 `unicode.dis,ko-g2.ctb` 테이블에 전달해 `⠠⠝⠒⠠⠎⠐⠕`을, 영어 `hello`를 `unicode.dis,en-ueb-g2.ctb` 테이블에 전달해 `⠓⠑⠇⠇⠕`을 확인했다. 운영 Dockerfile은 최신 Liblouis 3.38.0 릴리스를 컴파일하고 동일한 테이블 이름을 사용한다.

개발 화면의 점자 스튜디오에서도 기본값 `센서리`가 `liblouis ko-g2.ctb 표준 점역 결과예요.`로 표시됐으며, 입력을 `hello`로 바꾸면 `⠓⠑⠇⠇⠕` 및 `liblouis en-ueb-g2.ctb 표준 점역 결과예요.`로 갱신됐다. 커리큘럼 카드의 임의 점자 문자열은 모두 제거됐고, 점자 스튜디오와 오늘의 DotPad 미리보기만 표준 점역 결과를 사용한다.

17개 테스트 파일의 49개 테스트와 타입 검사를 통과했다. 프로덕션 번들은 Liblouis 서버 모듈을 포함해 생성됐으며, Dockerfile 변경 후 실제 이미지 빌드는 공개 배포 과정에서 확인한다.

체크포인트 직후 공개 도메인을 두 번 확인했을 때에는 점자 스튜디오의 `READY!` 표기와 카드의 이전 점자 문자열이 계속 보였다. 이는 공개 도메인에 이전 정적 번들이 아직 제공되는 상태이므로, Liblouis 3.38.0 운영 이미지 반영은 최신 배포가 전환된 뒤 캐시 우회 주소로 다시 확인한다.

운영 이미지 재배포 중 Liblouis 테이블 생성에 필요한 `m4` 누락이 확인돼 Dockerfile에 추가했다. 이후 공개 도메인의 `POST /api/trpc/braille.translate` 요청은 `센서리`에 대해 HTTP 200과 `engine: "liblouis"`, `table: "ko-g2.ctb"`, `braille: "⠠⠝⠒⠠⠎⠐⠕"`을 반환했다. 따라서 Liblouis 3.38.0 런타임과 한국어 점역 API가 실제 공개 서버에 반영된 것을 확인했다.

캐시 우회 쿼리를 해시 앞에 둔 최신 공개 프런트에서 점자 스튜디오는 `LIBLOUIS`, `Liblouis 표준 점역 결과`, `liblouis ko-g2.ctb 표준 점역 결과예요.`를 표시했고, 커리큘럼 카드의 임의 점자 문자열은 더 이상 표시되지 않았다. 최신 공개 서버의 `GET /api/trpc/braille.status`는 HTTP 200으로 `engine: "liblouis"`, `version: "3.38.0"`, `tables: ["ko-g2.ctb", "en-ueb-g2.ctb"]`를 반환했다. 이 응답은 컨테이너에서 직접 실행한 `lou_translate --version` 결과를 사용하므로, 운영 런타임 버전도 검증됐다.
