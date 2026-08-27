import React, { useEffect, useRef, useState } from "react";
import { Bluetooth, Cable, CheckCircle2, CircleAlert, Send, Unplug, Vibrate } from "lucide-react";
import { makeBrailleGraphicFrame, type BrailleDots } from "@/lib/dotpadFrame";
import { getDotPadBrowserSupport, loadDotPadSdk, type DotPadDevice, type DotPadSdkModule } from "@/lib/dotpadSdk";

type ConnectionState = "ready" | "scanning" | "connecting" | "connected" | "error" | "unsupported";

type DotPadConnectionProps = {
  dots: BrailleDots[];
  lessonLabel: string;
};

export function DotPadConnection({ dots, lessonLabel }: DotPadConnectionProps) {
  const sdkRef = useRef<InstanceType<DotPadSdkModule["DotPadSDK"]> | null>(null);
  const moduleRef = useRef<DotPadSdkModule | null>(null);
  const deviceRef = useRef<DotPadDevice | null>(null);
  const mountedRef = useRef(true);
  const [state, setState] = useState<ConnectionState>("ready");
  const [message, setMessage] = useState("DotPad을 연결하면 오늘의 촉각 학습 프레임을 보낼 수 있어요.");
  const [deviceName, setDeviceName] = useState("");
  const support = getDotPadBrowserSupport();

  useEffect(() => () => {
    mountedRef.current = false;
    sdkRef.current?.setCallBack(null, null);
    sdkRef.current?.disconnect(deviceRef.current);
    sdkRef.current = null;
    moduleRef.current = null;
    deviceRef.current = null;
  }, []);

  const setupSdk = async () => {
    const module = await loadDotPadSdk();
    sdkRef.current?.setCallBack(null, null);
    sdkRef.current?.disconnect(deviceRef.current);
    sdkRef.current = null;
    moduleRef.current = null;
    deviceRef.current = null;
    const sdk = new module.DotPadSDK();
    sdk.setCallBack(
      (device, dataCode, detail) => {
        if (!mountedRef.current || sdkRef.current !== sdk) return;
        if (dataCode === module.DataCodes.Connected) {
          deviceRef.current = device;
          setDeviceName(device.cellType || "DotPad");
          setState("connected");
          setMessage("DotPad이 연결됐어요. 오늘의 촉각 프레임을 보낼 수 있어요.");
        } else if (dataCode === module.DataCodes.ConnectedFail) {
          setState("error");
          setMessage("DotPad 연결에 실패했어요. 기기의 전원과 연결 상태를 확인해 주세요.");
        } else if (dataCode === module.DataCodes.Disconnected) {
          deviceRef.current = null;
          setDeviceName("");
          setState("ready");
          setMessage("DotPad 연결이 해제됐어요.");
        } else if (dataCode === module.DataCodes.ResponseDisplayLineComplete) {
          setMessage("촉각 프레임 전송이 완료됐어요. DotPad에서 점을 만져 보세요.");
        } else if (detail) {
          setMessage(detail);
        }
      },
      (_device, keyCode) => {
        if (!mountedRef.current || sdkRef.current !== sdk) return;
        if (keyCode === module.KeyCodes.PanningLeft) setMessage("DotPad의 이전 이동 키를 눌렀어요.");
        if (keyCode === module.KeyCodes.PanningRight) setMessage("DotPad의 다음 이동 키를 눌렀어요.");
      },
    );
    sdkRef.current = sdk;
    moduleRef.current = module;
    return { module, sdk };
  };

  const connect = async (transport: "ble" | "usb") => {
    if ((transport === "ble" && !support.ble) || (transport === "usb" && !support.usb)) {
      setState("unsupported");
      setMessage("이 브라우저에서는 DotPad 연결을 지원하지 않아요. Chrome 또는 Chromium 기반 브라우저를 사용해 주세요.");
      return;
    }

    setState("scanning");
    setMessage(transport === "ble" ? "블루투스 기기 선택기를 열고 있어요." : "USB DotPad 선택기를 열고 있어요.");
    try {
      const { module, sdk } = await setupSdk();
      const scanner = new module.DotPadScanner();
      const selected = transport === "ble" ? await scanner.startBleScan() : await scanner.startUsbScan();
      if (!selected) {
        setState("ready");
        setMessage("기기 선택을 취소했어요.");
        return;
      }
      setState("connecting");
      setMessage("DotPad과 안전하게 연결하고 있어요.");
      const device = transport === "ble"
        ? await sdk.connectBleDevice(selected)
        : await sdk.connectUsbDevice(selected);
      if (!device) {
        setState("error");
        setMessage("DotPad 연결을 완료하지 못했어요. 기기 전원과 케이블 또는 블루투스를 확인해 주세요.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError") {
        setState("ready");
        setMessage("기기 선택을 취소했거나 사용 가능한 DotPad을 찾지 못했어요.");
        return;
      }
      setState("error");
      const reason = error instanceof Error ? error.message : "알 수 없는 연결 오류";
      setMessage(`DotPad 연결을 시작하지 못했어요. ${reason}`);
    }
  };

  const sendFrame = () => {
    const sdk = sdkRef.current;
    const module = moduleRef.current;
    const device = deviceRef.current;
    if (!sdk || !module || !device || state !== "connected") return;
    if (!dots.length) {
      setMessage("표준 점역 결과를 준비하고 있어요. 잠시 뒤 다시 보내 주세요.");
      return;
    }
    try {
      sdk.displayGraphicData(makeBrailleGraphicFrame(dots), device, module.DisplayMode.GraphicMode);
      sdk.requestVibrator(device, 45, 35, 1);
      setMessage(`${lessonLabel}의 점자 프레임을 DotPad에 전송하고 있어요.`);
    } catch {
      setState("error");
      setMessage("촉각 프레임 전송에 실패했어요. DotPad 연결을 다시 확인해 주세요.");
    }
  };

  const disconnect = () => {
    sdkRef.current?.setCallBack(null, null);
    sdkRef.current?.disconnect(deviceRef.current);
    sdkRef.current = null;
    moduleRef.current = null;
    deviceRef.current = null;
    setDeviceName("");
    setState("ready");
    setMessage("DotPad 연결을 해제했어요.");
  };

  const connectionLabel = state === "connected" ? `${deviceName || "DotPad"} 연결됨` : state === "scanning" || state === "connecting" ? "연결 중" : state === "error" ? "연결 확인 필요" : "기기 미연결";

  return <section className="dotpad-connection" aria-labelledby="dotpad-connection-title">
    <div className="dotpad-connection-heading"><div><span className="capsule-label"><i /><i /><i /> DOTPAD LIVE <b>USB · BLE</b></span><h4 id="dotpad-connection-title">실제 DotPad에<br />오늘의 점을 올려요.</h4></div><span className={`dotpad-status ${state}`}><i />{connectionLabel}</span></div>
    <p>Chrome 또는 Chromium 브라우저에서 기기를 직접 선택해 연결하세요. 권한은 이 브라우저에서만 요청됩니다.</p>
    <div className="dotpad-actions">
      <button type="button" onClick={() => connect("ble")} disabled={state === "scanning" || state === "connecting" || !support.ble}><Bluetooth size={16} />블루투스 연결</button>
      <button type="button" onClick={() => connect("usb")} disabled={state === "scanning" || state === "connecting" || !support.usb}><Cable size={16} />USB 연결</button>
      {state === "connected" ? <button type="button" className="dotpad-send" onClick={sendFrame} disabled={!dots.length}><Send size={16} />오늘의 점자 보내기</button> : null}
      {state === "connected" ? <button type="button" className="dotpad-disconnect" onClick={disconnect}><Unplug size={16} />연결 해제</button> : null}
    </div>
    <div className="dotpad-live-note" role="status" aria-live="polite">{state === "error" || state === "unsupported" ? <CircleAlert size={16} /> : state === "connected" ? <CheckCircle2 size={16} /> : <Vibrate size={16} />}<span>{message}</span></div>
  </section>;
}
