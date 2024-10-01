// See https://stackoverflow.com/a/47880734
export const isWasmSupported = () => {
  try {
    if (
      typeof WebAssembly === "object" &&
      typeof WebAssembly.instantiate === "function"
    ) {
      const testModule = new WebAssembly.Module(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      );
      if (testModule instanceof WebAssembly.Module) {
        return (
          new WebAssembly.Instance(testModule) instanceof WebAssembly.Instance
        );
      }
    }
  } catch (e) {
    console.error(e);
    return false;
  }
  return false;
};
