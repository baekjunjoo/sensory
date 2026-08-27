/**
 * Thin typed loader for DotPad Web SDK 3.0.2.
 * Source: https://github.com/dotincorp/dotpad-sdk-guide/tree/main/Web/3.0.2
 */
export type DotPadDevice = {
  isConnect: boolean;
  cellType: string;
  numberCellRows: number;
  numberCellColumns: number;
  numberBrailleCellColumns: number;
};

export type DotPadSdkModule = {
  DisplayMode: { GraphicMode: string; TextMode: string };
  DataCodes: { Connected: string; ConnectedFail: string; Disconnected: string; ResponseDisplayLineComplete: string };
  KeyCodes: { PanningLeft: string; PanningRight: string };
  DotPadScanner: new () => {
    startBleScan: () => Promise<unknown | undefined>;
    startUsbScan: () => Promise<unknown | undefined>;
  };
  DotPadSDK: new () => {
    setCallBack: (
      messageCallback: ((device: DotPadDevice, dataCode: string, message: string) => void) | null,
      keyCallback: ((device: DotPadDevice, keyCode: string, message: string) => void) | null,
    ) => void;
    connectBleDevice: (device: unknown) => Promise<DotPadDevice | null | undefined>;
    connectUsbDevice: (device: unknown) => Promise<DotPadDevice | null | undefined>;
    disconnect: (device?: DotPadDevice | null) => void;
    displayGraphicData: (hexData: string, device?: DotPadDevice | null, displayMode?: string) => void;
    displayAllDown: (device?: DotPadDevice | null) => void;
    requestVibrator: (device?: DotPadDevice | null, onMs?: number, offMs?: number, repeatCount?: number) => void;
  };
};

let sdkLoader: Promise<DotPadSdkModule> | null = null;

export function loadDotPadSdk() {
  if (!sdkLoader) {
    // The vendor library is bundled only for the browser and initializes hardware after a user gesture.
    sdkLoader = import("./vendor/DotPadSDK-3.0.2.js") as unknown as Promise<DotPadSdkModule>;
  }
  return sdkLoader;
}

export function getDotPadBrowserSupport() {
  if (typeof navigator === "undefined") return { ble: false, usb: false };
  return { ble: "bluetooth" in navigator, usb: "serial" in navigator };
}
