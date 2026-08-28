# DotPad 그래픽 프레임 출력 조사 기록

## 현재 사용자 관찰

Bluetooth 연결은 정상이나, 실제 DotPad 320에서 점자가 기대한 모양으로 표시되지 않는다. 따라서 연결·권한보다 **그래픽 프레임의 좌표·비트 매핑**을 우선 점검한다.

## 공식 SDK에서 확인한 사실

Dot Inc.의 Web SDK 3.0.0 README는 그래픽 영역에 `displayGraphicData("FF".repeat(300))`처럼 **300바이트의 16진수 데이터**를 보낸다는 예시를 제공한다. Web SDK는 Chrome·Chromium 기반 브라우저의 Web Bluetooth/Web Serial 환경을 대상으로 한다. [1]

공식 `DemoApp`은 Chrome에서 연결·출력을 시험하는 샘플 앱으로 제공되며, `src` 디렉터리에 실제 프레임 생성과 전송 코드가 있다. 현재 README 화면 설명만으로는 픽셀의 행 우선/열 우선 순서와 한 바이트 안의 비트 방향을 확정할 수 없으므로, DemoApp의 실제 소스와 SDK 타입 정의를 다음 비교 대상으로 삼는다. [2]

| 확인 항목 | 현재 상태 | 다음 비교 대상 |
|---|---|---|
| Bluetooth 연결 | 사용자 확인상 정상 | 연결 경로는 유지 |
| 그래픽 페이로드 길이 | 300바이트 예시 확인 | 현재 60×40 프레임과 길이 비교 |
| 화면 좌표 순서 | README만으로 불명확 | DemoApp `src`의 배열 생성 루프 |
| 바이트 내 비트 방향 | README만으로 불명확 | SDK 구현·DemoApp 결과 |
| 시뮬레이터 | DemoApp 존재 확인, 별도 시뮬레이터 여부 미확정 | DemoApp `src`·README·웹 자산 점검 |

## SDK 구현에서 확인한 프레임 규칙

공식 `DotDevice.displayGraphicData()` 구현은 기본적으로 **그래픽 라인 1부터 10까지** 순회하고, 각 라인에 **30개의 1바이트 점자 셀**을 순서대로 배정한다. 즉 DotPad 320의 `60×40` 촉각점은 앱에서 직접 2,400비트 배열로 전송하는 방식이 아니라, `30열 × 10행 = 300`개의 **8점 점자 셀 바이트**를 행 우선으로 이어 만든 600자리 16진수 문자열로 전달해야 한다. [3]

그래픽 모드의 셀 데이터는 `00` 선행 상태로 전송되며, SDK는 DotPad 320 계열의 D3 기기에서 그래픽 버퍼를 부분 전송 방식으로 패킷화한다. 특히 `displayGraphicData()` 호출 인자는 SDK 예제처럼 `(hexData, device, DisplayMode.GraphicMode)` 순서여야 한다. [3] [4]

이 사실은 현재 앱이 **60×40 각 점을 바이트 하나처럼 다루거나**, 셀 단위 순서를 열 우선으로 만들거나, 8점 점자 비트 순서(특히 7·8점)를 반대로 조합했을 경우 실제 장치에서 문양이 깨질 수 있음을 뜻한다. 다음 단계에서는 현재 `DotPadConnection`의 프레임 생성기를 이 `10행 × 30열 셀` 규칙과 대조한다.

공식 Web SDK 3.0.2 구현에는 `PIN_ROWS_PER_CELL = 4`, `PIN_COLS_PER_CELL = 2`와 함께 실제 핀 좌표를 셀 바이트로 바꾸는 표가 포함되어 있다. 좌표 `(x, y)`의 비트값은 `(0,0)=0x01`, `(1,0)=0x10`, `(0,1)=0x02`, `(1,1)=0x20`, `(0,2)=0x04`, `(1,2)=0x40`, `(0,3)=0x08`, `(1,3)=0x80`이다. [5]

현재 앱의 `dotpadFrame.ts`는 60×40 점을 8비트 스트림으로 다시 패킹하고 MSB부터 값을 채우므로, 공식 셀 바이트 순서와 **근본적으로 다른 300바이트 데이터**를 만들고 있었다. 실제 DotPad에 점자가 흐트러진 직접 원인 후보가 확인됐으며, 다음 단계에서 공식 표를 사용하는 셀 단위 패커로 교체한다.

## 적용한 프레임 보정

`makeBrailleGraphicFrame()`을 60×40 비트맵 패킹 방식에서 SDK와 동일한 `30열 × 10행` 셀 배열 방식으로 교체했다. 6점 점자는 각 물리 셀의 공식 비트값 `1=01`, `2=02`, `3=04`, `4=10`, `5=20`, `6=40`으로 합성하고, 8점 확장 시 `7=08`, `8=80`을 사용한다. 프레임은 300셀·600자리 16진수로 행 우선 전달되며, 앱의 SDK 호출은 이미 공식 순서인 `displayGraphicData(hex, device, GraphicMode)`를 유지한다.

실제 장치에서 즉시 비교할 수 있도록 연결 후 `점 배열 점검` 버튼을 추가했다. 이 버튼은 중앙 한 줄에 왼쪽부터 독립된 **점 1·2·3·4·5·6·7·8** 셀을 전송한다. 장치에서는 첫 세 칸이 좌측 세로로, 다음 세 칸이 우측 세로로, 마지막 두 칸이 각각 좌측·우측 맨 아래 점으로 보여야 한다.

자동 검증으로 일반 프레임 길이·16진수 형식·빈 프레임 처리뿐 아니라, 공식 비트값 조합(`1=01`, `2+4+6=52`, `3+5=24`, `7+8=88`)과 8칸 점검행(`01 02 04 10 20 40 08 80`)을 추가했다. 전체 `24개` 테스트 파일·`78개` 테스트, TypeScript 검사와 Vite 프로덕션 빌드를 통과했다.

## 참조

[1] [DotPad SDK for Web v3.0.0 README](https://github.com/dotincorp/dotpad-sdk-guide/blob/main/Web/3.0.0/README.md)

[2] [DotPad Web SDK DemoApp](https://github.com/dotincorp/dotpad-sdk-guide/tree/main/Web/3.0.0/DemoApp)

[3] [DemoApp DotPadSDK-3.0.0.js](https://raw.githubusercontent.com/dotincorp/dotpad-sdk-guide/main/Web/3.0.0/DemoApp/src/sdk/DotPadSDK-3.0.0.js)

[4] [DemoApp App.tsx 그래픽 출력 예제](https://raw.githubusercontent.com/dotincorp/dotpad-sdk-guide/main/Web/3.0.0/DemoApp/src/App.tsx)

[5] [DotPad Web SDK 3.0.2 구현](https://raw.githubusercontent.com/dotincorp/dotpad-sdk-guide/main/Web/3.0.2/DotPadSDK-3.0.2.js)
