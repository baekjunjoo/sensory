# Liblouis 점역 및 카드 장식 검증

로컬 Liblouis 3.29.0의 `lou_translate`로 한국어 `센서리`를 `unicode.dis,ko-g2.ctb` 테이블에 전달해 `⠠⠝⠒⠠⠎⠐⠕`을, 영어 `hello`를 `unicode.dis,en-ueb-g2.ctb` 테이블에 전달해 `⠓⠑⠇⠇⠕`을 확인했다. 운영 Dockerfile은 최신 Liblouis 3.38.0 릴리스를 컴파일하고 동일한 테이블 이름을 사용한다.

개발 화면의 점자 스튜디오에서도 기본값 `센서리`가 `liblouis ko-g2.ctb 표준 점역 결과예요.`로 표시됐으며, 입력을 `hello`로 바꾸면 `⠓⠑⠇⠇⠕` 및 `liblouis en-ueb-g2.ctb 표준 점역 결과예요.`로 갱신됐다. 커리큘럼 카드의 임의 점자 문자열은 모두 제거됐고, 점자 스튜디오와 오늘의 DotPad 미리보기만 표준 점역 결과를 사용한다.

17개 테스트 파일의 49개 테스트와 타입 검사를 통과했다. 프로덕션 번들은 Liblouis 서버 모듈을 포함해 생성됐으며, Dockerfile 변경 후 실제 이미지 빌드는 공개 배포 과정에서 확인한다.
