# Super Dot TTS 전환 검증 기록

LIVE DOTPAD PREVIEW에는 Liblouis 점역 셀을 보여 주는 촉각 격자만 유지하고, 아래의 중복 유니코드 점자 문자열은 제거했다. 해당 조건은 홈 렌더링 테스트에서 `.studio-braille` 부재와 `.studio-dotpad` 격자 존재로 확인한다.

접근성 읽기는 Piper 서버 합성 대신 Super Dot 브라우저 음성으로 동작한다. 문장 시작·다음 문장 진행·오류 안내·정지·저시력 하이라이트·로컬 텍스트 읽기·한국어/영어/스페인어 설정 전달을 테스트했다. 실제 음성 출력 장치가 없는 자동 검증 환경에서는 재생 품질을 판정할 수 없으므로, 운영 배포 뒤 사용자의 Chrome·Edge·Safari에서 소리 출력과 스페인어 설치 음성을 확인해야 한다.

Piper 서버 합성 모듈·음성 모델 다운로드·전용 브라우저 대체 모듈은 제거했다. 최종 로컬 검증에서 15개 테스트 파일의 33개 테스트, 타입 검사, 프로덕션 번들을 통과했다.

개발 브라우저에서 `window.SDTTS`는 `speak`, `isEcho`, `detectTextLang`, `setMicActive`, `configure`, `getConfig`, `voices`, `onLog`, `stop` API를 제공했고 `speechSynthesis`도 감지됐다. `.studio-braille` 요소는 없었으며, LIVE DOTPAD PREVIEW에는 중복 유니코드 점자 문구가 렌더링되지 않았다. 초기화된 개발 환경에는 Liblouis 실행 파일이 아직 설치되지 않아 촉각 격자 셀 수는 0으로 표시됐고, 이는 운영 Docker 이미지와 별개인 로컬 런타임 의존성 문제이므로 로컬 Liblouis 유틸리티를 복구한 뒤 다시 확인한다.
