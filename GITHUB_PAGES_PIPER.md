# GitHub Pages와 Piper 자연 음성 연결

GitHub Pages는 Sensory의 정적 화면을 제공하고, 자연 음성은 Manus에 배포된 Piper 서버가 담당합니다. GitHub Pages만으로는 Node·Python과 Piper 음성 모델을 실행할 수 없으므로 두 주소를 분리하는 것이 필요합니다.

## 한 번만 설정하기

1. 이 프로젝트 관리 화면에서 **Publish**를 눌러 Manus 서버 배포를 완료합니다.
2. 배포된 공개 주소를 복사합니다. 예: `https://your-sensory.manus.space`
3. GitHub 저장소의 **Settings → Secrets and variables → Actions → Variables**에서 `PIPER_API_URL` 변수를 만들고 위 주소를 입력합니다. 끝의 `/`는 생략합니다.
4. GitHub 저장소의 **Settings → Pages → Build and deployment**에서 Source를 **GitHub Actions**로 선택합니다.
5. `main`에 새 커밋을 푸시하거나 **Actions → Deploy Sensory to GitHub Pages → Run workflow**를 실행합니다.

그 뒤 `https://baekjunjoo.github.io/sensory/`는 최신 화면을 제공하고, 접근성 읽기 패널은 Manus Piper API에서 한국어·영어·스페인어 자연 음성을 받습니다. `PIPER_API_URL`이 비어 있거나 서버에 연결할 수 없으면 화면은 계속 열리고 브라우저 음성으로 대체됩니다.

## 보안 원칙

Piper API는 기본적으로 `https://baekjunjoo.github.io` 출처만 CORS로 허용합니다. 다른 Pages 도메인을 쓸 경우 Manus 서버 환경 변수 `PIPER_ALLOWED_ORIGIN`에 정확한 Origin을 설정해야 합니다.
