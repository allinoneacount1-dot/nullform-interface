import { r as reactExports } from "../react.mjs";
import { D as DEPRECATED_getWallets } from "../wallet-standard__app.mjs";
import { i as isWalletAdapterCompatibleWallet, S as StandardWalletAdapter } from "./wallet-standard-wallet-adapter-base+[...].mjs";
function useStandardWalletAdapters(adapters) {
  const warnings = useConstant(() => /* @__PURE__ */ new Set());
  const { get, on } = useConstant(() => DEPRECATED_getWallets());
  const [standardAdapters, setStandardAdapters] = reactExports.useState(() => wrapWalletsWithAdapters(get()));
  reactExports.useEffect(() => {
    const listeners = [
      on("register", (...wallets) => setStandardAdapters((standardAdapters2) => [...standardAdapters2, ...wrapWalletsWithAdapters(wallets)])),
      on("unregister", (...wallets) => setStandardAdapters((standardAdapters2) => standardAdapters2.filter((standardAdapter) => wallets.some((wallet) => wallet === standardAdapter.wallet))))
    ];
    return () => listeners.forEach((off) => off());
  }, [on]);
  const prevStandardAdapters = usePrevious(standardAdapters);
  reactExports.useEffect(() => {
    if (!prevStandardAdapters)
      return;
    const currentAdapters = new Set(standardAdapters);
    const removedAdapters = new Set(prevStandardAdapters.filter((previousAdapter) => !currentAdapters.has(previousAdapter)));
    removedAdapters.forEach((adapter) => adapter.destroy());
  }, [prevStandardAdapters, standardAdapters]);
  reactExports.useEffect(() => () => standardAdapters.forEach((adapter) => adapter.destroy()), []);
  return reactExports.useMemo(() => [
    ...standardAdapters,
    ...adapters.filter(({ name }) => {
      if (standardAdapters.some((standardAdapter) => standardAdapter.name === name)) {
        if (!warnings.has(name)) {
          warnings.add(name);
          console.warn(`${name} was registered as a Standard Wallet. The Wallet Adapter for ${name} can be removed from your app.`);
        }
        return false;
      }
      return true;
    })
  ], [standardAdapters, adapters, warnings]);
}
function useConstant(fn) {
  const ref = reactExports.useRef(void 0);
  if (ref.current === void 0) {
    ref.current = { value: fn() };
  }
  return ref.current.value;
}
function usePrevious(state) {
  const ref = reactExports.useRef(void 0);
  reactExports.useEffect(() => {
    ref.current = state;
  });
  return ref.current;
}
function wrapWalletsWithAdapters(wallets) {
  return wallets.filter(isWalletAdapterCompatibleWallet).map((wallet) => new StandardWalletAdapter({ wallet }));
}
export {
  useStandardWalletAdapters as u
};
