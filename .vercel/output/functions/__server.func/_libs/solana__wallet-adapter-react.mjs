import { C as Connection } from "./solana__web3.js.mjs";
import { r as reactExports, R as React } from "./react.mjs";
import { S as SolanaMobileWalletAdapterWalletName, a as SolanaMobileWalletAdapter, c as createDefaultWalletNotFoundHandler, b as createDefaultAuthorizationResultCache, d as createDefaultAddressSelector } from "./@solana-mobile/wallet-adapter-mobile+[...].mjs";
import { W as WalletError, a as WalletReadyState, b as WalletNotReadyError, c as WalletNotConnectedError } from "./solana__wallet-adapter-base.mjs";
import { u as useStandardWalletAdapters } from "./@solana/wallet-standard-wallet-adapter-react+[...].mjs";
const ConnectionContext = reactExports.createContext({});
function useConnection() {
  return reactExports.useContext(ConnectionContext);
}
const ConnectionProvider = ({ children, endpoint, config = { commitment: "confirmed" } }) => {
  const connection = reactExports.useMemo(() => new Connection(endpoint, config), [endpoint, config]);
  return React.createElement(ConnectionContext.Provider, { value: { connection } }, children);
};
class WalletNotSelectedError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletNotSelectedError";
  }
}
const EMPTY_ARRAY = [];
const DEFAULT_CONTEXT = {
  autoConnect: false,
  connecting: false,
  connected: false,
  disconnecting: false,
  select() {
    logMissingProviderError("call", "select");
  },
  connect() {
    return Promise.reject(logMissingProviderError("call", "connect"));
  },
  disconnect() {
    return Promise.reject(logMissingProviderError("call", "disconnect"));
  },
  sendTransaction() {
    return Promise.reject(logMissingProviderError("call", "sendTransaction"));
  },
  signTransaction() {
    return Promise.reject(logMissingProviderError("call", "signTransaction"));
  },
  signAllTransactions() {
    return Promise.reject(logMissingProviderError("call", "signAllTransactions"));
  },
  signMessage() {
    return Promise.reject(logMissingProviderError("call", "signMessage"));
  },
  signIn() {
    return Promise.reject(logMissingProviderError("call", "signIn"));
  }
};
Object.defineProperty(DEFAULT_CONTEXT, "wallets", {
  get() {
    logMissingProviderError("read", "wallets");
    return EMPTY_ARRAY;
  }
});
Object.defineProperty(DEFAULT_CONTEXT, "wallet", {
  get() {
    logMissingProviderError("read", "wallet");
    return null;
  }
});
Object.defineProperty(DEFAULT_CONTEXT, "publicKey", {
  get() {
    logMissingProviderError("read", "publicKey");
    return null;
  }
});
function logMissingProviderError(action, property) {
  const error = new Error(`You have tried to ${action} "${property}" on a WalletContext without providing one. Make sure to render a WalletProvider as an ancestor of the component that uses WalletContext.`);
  console.error(error);
  return error;
}
const WalletContext = reactExports.createContext(DEFAULT_CONTEXT);
function useWallet() {
  return reactExports.useContext(WalletContext);
}
function useLocalStorage(key, defaultState) {
  const state = reactExports.useState(() => {
    try {
      const value2 = localStorage.getItem(key);
      if (value2)
        return JSON.parse(value2);
    } catch (error) {
      if (typeof window !== "undefined") {
        console.error(error);
      }
    }
    return defaultState;
  });
  const value = state[0];
  const isFirstRenderRef = reactExports.useRef(true);
  reactExports.useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      if (typeof window !== "undefined") {
        console.error(error);
      }
    }
  }, [value, key]);
  return state;
}
var Environment;
(function(Environment2) {
  Environment2[Environment2["DESKTOP_WEB"] = 0] = "DESKTOP_WEB";
  Environment2[Environment2["MOBILE_WEB"] = 1] = "MOBILE_WEB";
})(Environment || (Environment = {}));
function isWebView(userAgentString) {
  return /(WebView|Version\/.+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+)|; wv\).+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+))/i.test(userAgentString);
}
function getEnvironment({ adapters, userAgentString }) {
  if (adapters.some((adapter) => adapter.name !== SolanaMobileWalletAdapterWalletName && adapter.readyState === WalletReadyState.Installed)) {
    return Environment.DESKTOP_WEB;
  }
  if (userAgentString && // Step 1: Check whether we're on a platform that supports MWA at all.
  /android/i.test(userAgentString) && // Step 2: Determine that we are *not* running in a WebView.
  !isWebView(userAgentString)) {
    return Environment.MOBILE_WEB;
  } else {
    return Environment.DESKTOP_WEB;
  }
}
function getInferredClusterFromEndpoint(endpoint) {
  if (!endpoint) {
    return "mainnet-beta";
  }
  if (/devnet/i.test(endpoint)) {
    return "devnet";
  } else if (/testnet/i.test(endpoint)) {
    return "testnet";
  } else {
    return "mainnet-beta";
  }
}
function WalletProviderBase({ children, wallets: adapters, adapter, isUnloadingRef, onAutoConnectRequest, onConnectError, onError, onSelectWallet }) {
  const isConnectingRef = reactExports.useRef(false);
  const [connecting, setConnecting] = reactExports.useState(false);
  const isDisconnectingRef = reactExports.useRef(false);
  const [disconnecting, setDisconnecting] = reactExports.useState(false);
  const [publicKey, setPublicKey] = reactExports.useState(() => adapter?.publicKey ?? null);
  const [connected, setConnected] = reactExports.useState(() => adapter?.connected ?? false);
  const onErrorRef = reactExports.useRef(onError);
  reactExports.useEffect(() => {
    onErrorRef.current = onError;
    return () => {
      onErrorRef.current = void 0;
    };
  }, [onError]);
  const handleErrorRef = reactExports.useRef((error, adapter2) => {
    if (!isUnloadingRef.current) {
      if (onErrorRef.current) {
        onErrorRef.current(error, adapter2);
      } else {
        console.error(error, adapter2);
        if (error instanceof WalletNotReadyError && typeof window !== "undefined" && adapter2) {
          window.open(adapter2.url, "_blank");
        }
      }
    }
    return error;
  });
  const [wallets, setWallets] = reactExports.useState(() => adapters.map((adapter2) => ({
    adapter: adapter2,
    readyState: adapter2.readyState
  })).filter(({ readyState }) => readyState !== WalletReadyState.Unsupported));
  reactExports.useEffect(() => {
    setWallets((wallets2) => adapters.map((adapter2, index) => {
      const wallet2 = wallets2[index];
      return wallet2 && wallet2.adapter === adapter2 && wallet2.readyState === adapter2.readyState ? wallet2 : {
        adapter: adapter2,
        readyState: adapter2.readyState
      };
    }).filter(({ readyState }) => readyState !== WalletReadyState.Unsupported));
    function handleReadyStateChange(readyState) {
      setWallets((prevWallets) => {
        const index = prevWallets.findIndex(({ adapter: adapter3 }) => adapter3 === this);
        if (index === -1)
          return prevWallets;
        const { adapter: adapter2 } = prevWallets[index];
        return [
          ...prevWallets.slice(0, index),
          { adapter: adapter2, readyState },
          ...prevWallets.slice(index + 1)
        ].filter(({ readyState: readyState2 }) => readyState2 !== WalletReadyState.Unsupported);
      });
    }
    adapters.forEach((adapter2) => adapter2.on("readyStateChange", handleReadyStateChange, adapter2));
    return () => {
      adapters.forEach((adapter2) => adapter2.off("readyStateChange", handleReadyStateChange, adapter2));
    };
  }, [adapter, adapters]);
  const wallet = reactExports.useMemo(() => wallets.find((wallet2) => wallet2.adapter === adapter) ?? null, [adapter, wallets]);
  reactExports.useEffect(() => {
    if (!adapter)
      return;
    const handleConnect2 = (publicKey2) => {
      setPublicKey(publicKey2);
      isConnectingRef.current = false;
      setConnecting(false);
      setConnected(true);
      isDisconnectingRef.current = false;
      setDisconnecting(false);
    };
    const handleDisconnect2 = () => {
      if (isUnloadingRef.current)
        return;
      setPublicKey(null);
      isConnectingRef.current = false;
      setConnecting(false);
      setConnected(false);
      isDisconnectingRef.current = false;
      setDisconnecting(false);
    };
    const handleError = (error) => {
      handleErrorRef.current(error, adapter);
    };
    adapter.on("connect", handleConnect2);
    adapter.on("disconnect", handleDisconnect2);
    adapter.on("error", handleError);
    return () => {
      adapter.off("connect", handleConnect2);
      adapter.off("disconnect", handleDisconnect2);
      adapter.off("error", handleError);
      handleDisconnect2();
    };
  }, [adapter, isUnloadingRef]);
  const didAttemptAutoConnectRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    return () => {
      didAttemptAutoConnectRef.current = false;
    };
  }, [adapter]);
  reactExports.useEffect(() => {
    if (didAttemptAutoConnectRef.current || isConnectingRef.current || connected || !onAutoConnectRequest || !(wallet?.readyState === WalletReadyState.Installed || wallet?.readyState === WalletReadyState.Loadable))
      return;
    isConnectingRef.current = true;
    setConnecting(true);
    didAttemptAutoConnectRef.current = true;
    (async function() {
      try {
        await onAutoConnectRequest();
      } catch {
        onConnectError();
      } finally {
        setConnecting(false);
        isConnectingRef.current = false;
      }
    })();
  }, [connected, onAutoConnectRequest, onConnectError, wallet]);
  const sendTransaction = reactExports.useCallback(async (transaction, connection, options) => {
    if (!adapter)
      throw handleErrorRef.current(new WalletNotSelectedError());
    if (!connected)
      throw handleErrorRef.current(new WalletNotConnectedError(), adapter);
    return await adapter.sendTransaction(transaction, connection, options);
  }, [adapter, connected]);
  const signTransaction = reactExports.useMemo(() => adapter && "signTransaction" in adapter ? async (transaction) => {
    if (!connected)
      throw handleErrorRef.current(new WalletNotConnectedError(), adapter);
    return await adapter.signTransaction(transaction);
  } : void 0, [adapter, connected]);
  const signAllTransactions = reactExports.useMemo(() => adapter && "signAllTransactions" in adapter ? async (transactions) => {
    if (!connected)
      throw handleErrorRef.current(new WalletNotConnectedError(), adapter);
    return await adapter.signAllTransactions(transactions);
  } : void 0, [adapter, connected]);
  const signMessage = reactExports.useMemo(() => adapter && "signMessage" in adapter ? async (message) => {
    if (!connected)
      throw handleErrorRef.current(new WalletNotConnectedError(), adapter);
    return await adapter.signMessage(message);
  } : void 0, [adapter, connected]);
  const signIn = reactExports.useMemo(() => adapter && "signIn" in adapter ? async (input) => {
    return await adapter.signIn(input);
  } : void 0, [adapter]);
  const handleConnect = reactExports.useCallback(async () => {
    if (isConnectingRef.current || isDisconnectingRef.current || wallet?.adapter.connected)
      return;
    if (!wallet)
      throw handleErrorRef.current(new WalletNotSelectedError());
    const { adapter: adapter2, readyState } = wallet;
    if (!(readyState === WalletReadyState.Installed || readyState === WalletReadyState.Loadable))
      throw handleErrorRef.current(new WalletNotReadyError(), adapter2);
    isConnectingRef.current = true;
    setConnecting(true);
    try {
      await adapter2.connect();
    } catch (e) {
      onConnectError();
      throw e;
    } finally {
      setConnecting(false);
      isConnectingRef.current = false;
    }
  }, [onConnectError, wallet]);
  const handleDisconnect = reactExports.useCallback(async () => {
    if (isDisconnectingRef.current)
      return;
    if (!adapter)
      return;
    isDisconnectingRef.current = true;
    setDisconnecting(true);
    try {
      await adapter.disconnect();
    } finally {
      setDisconnecting(false);
      isDisconnectingRef.current = false;
    }
  }, [adapter]);
  return React.createElement(WalletContext.Provider, { value: {
    autoConnect: !!onAutoConnectRequest,
    wallets,
    wallet,
    publicKey,
    connected,
    connecting,
    disconnecting,
    select: onSelectWallet,
    connect: handleConnect,
    disconnect: handleDisconnect,
    sendTransaction,
    signTransaction,
    signAllTransactions,
    signMessage,
    signIn
  } }, children);
}
let _userAgent;
function getUserAgent() {
  if (_userAgent === void 0) {
    _userAgent = globalThis.navigator?.userAgent ?? null;
  }
  return _userAgent;
}
function getIsMobile(adapters) {
  const userAgentString = getUserAgent();
  return getEnvironment({ adapters, userAgentString }) === Environment.MOBILE_WEB;
}
function getUriForAppIdentity() {
  const location = globalThis.location;
  if (!location)
    return;
  return `${location.protocol}//${location.host}`;
}
function WalletProvider({ children, wallets: adapters, autoConnect, localStorageKey = "walletName", onError }) {
  const { connection } = useConnection();
  const adaptersWithStandardAdapters = useStandardWalletAdapters(adapters);
  const mobileWalletAdapter = reactExports.useMemo(() => {
    if (!getIsMobile(adaptersWithStandardAdapters)) {
      return null;
    }
    const existingMobileWalletAdapter = adaptersWithStandardAdapters.find((adapter2) => adapter2.name === SolanaMobileWalletAdapterWalletName);
    if (existingMobileWalletAdapter) {
      return existingMobileWalletAdapter;
    }
    return new SolanaMobileWalletAdapter({
      addressSelector: createDefaultAddressSelector(),
      appIdentity: {
        uri: getUriForAppIdentity()
      },
      authorizationResultCache: createDefaultAuthorizationResultCache(),
      cluster: getInferredClusterFromEndpoint(connection?.rpcEndpoint),
      onWalletNotFound: createDefaultWalletNotFoundHandler()
    });
  }, [adaptersWithStandardAdapters, connection?.rpcEndpoint]);
  const adaptersWithMobileWalletAdapter = reactExports.useMemo(() => {
    if (mobileWalletAdapter == null || adaptersWithStandardAdapters.indexOf(mobileWalletAdapter) !== -1) {
      return adaptersWithStandardAdapters;
    }
    return [mobileWalletAdapter, ...adaptersWithStandardAdapters];
  }, [adaptersWithStandardAdapters, mobileWalletAdapter]);
  const [walletName, setWalletName] = useLocalStorage(localStorageKey, null);
  const adapter = reactExports.useMemo(() => adaptersWithMobileWalletAdapter.find((a) => a.name === walletName) ?? null, [adaptersWithMobileWalletAdapter, walletName]);
  const changeWallet = reactExports.useCallback((nextWalletName) => {
    if (walletName === nextWalletName)
      return;
    if (adapter && // Selecting a wallet other than the mobile wallet adapter is not
    // sufficient reason to call `disconnect` on the mobile wallet adapter.
    // Calling `disconnect` on the mobile wallet adapter causes the entire
    // authorization store to be wiped.
    adapter.name !== SolanaMobileWalletAdapterWalletName) {
      adapter.disconnect();
    }
    setWalletName(nextWalletName);
  }, [adapter, setWalletName, walletName]);
  reactExports.useEffect(() => {
    if (!adapter)
      return;
    function handleDisconnect() {
      if (isUnloadingRef.current)
        return;
      setWalletName(null);
    }
    adapter.on("disconnect", handleDisconnect);
    return () => {
      adapter.off("disconnect", handleDisconnect);
    };
  }, [adapter, adaptersWithStandardAdapters, setWalletName, walletName]);
  const hasUserSelectedAWallet = reactExports.useRef(false);
  const handleAutoConnectRequest = reactExports.useMemo(() => {
    if (!autoConnect || !adapter)
      return;
    return async () => {
      if (autoConnect === true || await autoConnect(adapter)) {
        if (hasUserSelectedAWallet.current) {
          await adapter.connect();
        } else {
          await adapter.autoConnect();
        }
      }
    };
  }, [autoConnect, adapter]);
  const isUnloadingRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (walletName === SolanaMobileWalletAdapterWalletName && getIsMobile(adaptersWithStandardAdapters)) {
      isUnloadingRef.current = false;
      return;
    }
    function handleBeforeUnload() {
      isUnloadingRef.current = true;
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [adaptersWithStandardAdapters, walletName]);
  const handleConnectError = reactExports.useCallback(() => {
    if (adapter) {
      changeWallet(null);
    }
  }, [adapter, changeWallet]);
  const selectWallet = reactExports.useCallback((walletName2) => {
    hasUserSelectedAWallet.current = true;
    changeWallet(walletName2);
  }, [changeWallet]);
  return React.createElement(WalletProviderBase, { wallets: adaptersWithMobileWalletAdapter, adapter, isUnloadingRef, onAutoConnectRequest: handleAutoConnectRequest, onConnectError: handleConnectError, onError, onSelectWallet: selectWallet }, children);
}
export {
  ConnectionProvider as C,
  WalletProvider as W,
  useConnection as a,
  useWallet as u
};
