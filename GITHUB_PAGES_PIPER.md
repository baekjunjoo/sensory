# GitHub Pages와 Sensory 공용 API 연결

GitHub Pages는 Sensory의 정적 화면과 공개 GitHub 릴리스의 3D WebP 자산을 제공합니다. 접근성 읽기는 사용자 제공 Super Dot TTS 모듈이 브라우저의 설치된 음성을 사용하고, 표준 점역은 Manus에 배포된 Liblouis 공용 API가 처리합니다. 따라서 정적 Pages와 점역 API 주소를 분리합니다.

## 한 번만 설정하기

1. 이 프로젝트의 최신 체크포인트를 저장해 Manus 공개 배포를 완료합니다.
2. 배포된 공개 주소를 복사합니다. 예: `https://your-sensory.manus.space`
3. GitHub 저장소의 **Settings → Secrets and variables → Actions → Variables**에서 `SENSORY_API_URL` 변수를 만들고 위 주소를 입력합니다. 끝의 `/`는 생략합니다. 워크플로는 이전 설정의 `PIPER_API_URL`도 임시 호환값으로 읽지만, 최신 설정은 `SENSORY_API_URL`을 우선 사용합니다.
4. GitHub 저장소의 **Settings → Pages → Build and deployment**에서 Source를 **GitHub Actions**로 선택합니다.
5. `main`에 새 커밋을 푸시하거나 **Actions → Deploy Sensory to GitHub Pages → Run workflow**를 실행합니다.

그 뒤 `https://baekjunjoo.github.io/sensory/`는 최신 화면과 GitHub 릴리스의 3D 자산을 제공하고, 접근성 읽기 패널은 설치된 한국어·영어·스페인어 기기 음성을 사용합니다. `SENSORY_API_URL`이 비어 있거나 점역 API에 연결할 수 없으면 화면은 계속 열리며 점역 상태는 오류 안내로 바뀝니다.

## 보안 원칙

Sensory 공용 API는 기본적으로 `https://baekjunjoo.github.io` 출처만 CORS로 허용합니다. 다른 Pages 도메인을 쓸 경우 Manus 서버 환경 변수 `SENSORY_PUBLIC_API_ALLOWED_ORIGIN`에 정확한 Origin을 설정해야 합니다.
