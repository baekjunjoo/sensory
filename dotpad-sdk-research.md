# DotPad Web SDK 조사 메모

## 확인 기준

- 가이드 저장소: https://github.com/dotincorp/dotpad-sdk-guide
- 확인 일자: 2026-08-27
- 최신 저장소 커밋: `437210b1e5b3f4cc5aaa8db5759206067b4edd6e` (2026-08-13)

## 확인된 내용

- DotPad는 점자 텍스트와 촉각 그래픽을 표현하는 기기이며 BLE와 USB-C 통신을 지원한다.
- 공개 가이드의 Web 디렉터리에는 1.0.0과 3.0.0 계열이 있으며, 최신 커밋에는 `Web/3.0.2`와 `web-sdk-3.0.2.zip`이 추가됐다.
- 최신 Web SDK에는 브라우저용 liblouis WebAssembly·점역 테이블이 포함되어 있다.
- Web SDK 3.0.2는 Chrome 등 Chromium 기반 브라우저의 Web Bluetooth와 Web Serial에서만 동작한다. Firefox와 Safari에서는 해당 API가 지원되지 않는다.
- `DotPadScanner.startBleScan()` 또는 `startUsbScan()`으로 사용자 제스처에서 기기 선택기를 열고, `DotPadSDK.connectBleDevice()` 또는 `connectUsbDevice()`로 연결한다. `DataCodes.Connected` 콜백 이후에만 전송한다.
- `displayGraphicData(hexData, device, DisplayMode.GraphicMode)`는 그래픽 영역으로 점 배열을 전송하며, 60×40 점 그래픽은 2,400비트 = 300바이트 = 600자리 hex로 구성할 수 있다. SDK는 기존 출력과 비교해 필요한 라인만 전송한다.
- `displayTextData()`·`translateText()`·`buildMultiLineData()`는 3.0.2의 liblouis 기반 점역 기능이며, 해당 기능을 쓸 경우 정적 liblouis 파일·LGPL 라이선스·래퍼 소스를 함께 배포해야 한다.
- `setCallBack()`의 `KeyCodes.PanningLeft`·`PanningRight`는 학습지나 점역 텍스트의 이전·다음 프레임 전환에 연결할 수 있다. `requestVibrator()`는 짧은 촉각 알림을 제공한다.

## 현재 Sensory 통합 방침

1. 웹 SDK를 클라이언트에서만 로드해 사용자가 기기 선택 권한을 직접 승인하도록 한다.
2. 학습지의 6점 점자 셀과 간단한 촉각 그림을 60×40 점 배열(300바이트)로 변환해 DotPad 그래픽 영역으로 전송한다.
3. 연결 불가·미지원 브라우저·권한 거부 시에는 시각 프리뷰와 음성 안내를 유지한다.
4. 초기 범위에서는 이미 학습지에 있는 점자 셀·촉각 그래픽 데이터만 전송해 liblouis 배포 복잡도를 피한다. 전체 텍스트 점역은 다음 단계에서 SDK 라이선스 파일과 함께 추가한다.
5. 실제 DotPad 하드웨어 연결은 지원 브라우저와 기기 권한이 필요하므로, 코드 검증과 별도로 사용자 기기에서 최종 확인한다.

## 출처

- [DotPad SDK Guide README](https://github.com/dotincorp/dotpad-sdk-guide)
- [Web SDK 3.0.2 변경 내역](https://github.com/dotincorp/dotpad-sdk-guide/commit/437210b1e5b3f4cc5aaa8db5759206067b4edd6e)
- [Web SDK 3.0.2 README](https://raw.githubusercontent.com/dotincorp/dotpad-sdk-guide/main/Web/3.0.2/README.md)
