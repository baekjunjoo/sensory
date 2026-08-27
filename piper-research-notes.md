# Piper 저지연 접근성 TTS 조사 메모

- Piper는 로컬에서 실행되는 TTS 엔진이며, 현재 Python 패키지는 `pip install piper-tts`로 설치할 수 있다. Python 3.9 이상을 요구하고, Linux x86_64용 wheel을 제공한다. [PyPI](https://pypi.org/project/piper-tts/)
- 공식 Python API는 `PiperVoice.load("/path/to/model.onnx")` 후 `voice.synthesize_wav(text, wav_file)`로 WAV를 합성한다. 스트리밍에는 `voice.synthesize(text)`를 사용할 수 있다. [Python API](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/API_PYTHON.md)
- 공식 HTTP 서버는 `python3 -m piper.http_server -m <voice>`로 실행되며 `/synthesize` 엔드포인트에서 `text`, `voice`, `length_scale` 등을 받아 WAV를 반환한다. [HTTP API](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/API_HTTP.md)
- Piper 샘플은 한국어·영어를 포함한 다수의 언어를 제공하며, 저지연을 위해서는 x_low 또는 low 품질 모델을 우선 고려한다. 샘플 설명상 x_low는 16kHz·5–7M 파라미터, low는 16kHz·15–20M 파라미터다. [Voice samples](https://rhasspy.github.io/piper-samples/)
- 한국어 KSS Piper ONNX 모델은 `neurlang/piper-onnx-kss-korean` 공개 저장소에서 제공된다. [Korean KSS model](https://huggingface.co/neurlang/piper-onnx-kss-korean)
- 영어 기본 모델은 Piper 음성 저장소의 `en_US` 계열을 사용한다. 예: `en_US-lessac-medium`. [Voice list](https://github.com/rhasspy/piper/blob/master/VOICES.md)

## 지연시간 설계 원칙

1. Node 서버가 Piper HTTP 하위 프로세스를 한 번만 시작해 음성 모델을 메모리에 유지한다.
2. 합성 결과는 `언어 + 속도 + 텍스트` 해시 키의 LRU 메모리 캐시로 보관한다.
3. 같은 키의 동시 요청은 하나의 합성 작업을 공유해 중복 CPU 사용을 막는다.
4. 클라이언트는 짧은 문단 단위로 요청·재생하고, 합성 실패 시 브라우저 음성으로 명시적으로 대체한다.
