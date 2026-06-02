import { E as EventEmitter } from "./eventemitter3.mjs";
import { S as StandardConnect, a as StandardEvents } from "./wallet-standard__features.mjs";
import { S as SolanaSignAndSendTransaction, a as SolanaSignTransaction } from "./@solana/wallet-standard-features+[...].mjs";
class WalletError extends Error {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(message, error) {
    super(message);
    this.error = error;
  }
}
class WalletNotReadyError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletNotReadyError";
  }
}
class WalletLoadError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletLoadError";
  }
}
class WalletConfigError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletConfigError";
  }
}
class WalletConnectionError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletConnectionError";
  }
}
class WalletDisconnectedError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletDisconnectedError";
  }
}
class WalletDisconnectionError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletDisconnectionError";
  }
}
class WalletAccountError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletAccountError";
  }
}
class WalletPublicKeyError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletPublicKeyError";
  }
}
class WalletNotConnectedError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletNotConnectedError";
  }
}
class WalletSendTransactionError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletSendTransactionError";
  }
}
class WalletSignTransactionError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletSignTransactionError";
  }
}
class WalletSignMessageError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletSignMessageError";
  }
}
class WalletSignInError extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "WalletSignInError";
  }
}
var WalletReadyState;
(function(WalletReadyState2) {
  WalletReadyState2["Installed"] = "Installed";
  WalletReadyState2["NotDetected"] = "NotDetected";
  WalletReadyState2["Loadable"] = "Loadable";
  WalletReadyState2["Unsupported"] = "Unsupported";
})(WalletReadyState || (WalletReadyState = {}));
class BaseWalletAdapter extends EventEmitter {
  get connected() {
    return !!this.publicKey;
  }
  async autoConnect() {
    await this.connect();
  }
  async prepareTransaction(transaction, connection, options = {}) {
    const publicKey = this.publicKey;
    if (!publicKey)
      throw new WalletNotConnectedError();
    transaction.feePayer = transaction.feePayer || publicKey;
    transaction.recentBlockhash = transaction.recentBlockhash || (await connection.getLatestBlockhash({
      commitment: options.preflightCommitment,
      minContextSlot: options.minContextSlot
    })).blockhash;
    return transaction;
  }
}
function scopePollingDetectionStrategy(detect) {
  if (typeof window === "undefined" || typeof document === "undefined")
    return;
  const disposers = [];
  function detectAndDispose() {
    const detected = detect();
    if (detected) {
      for (const dispose of disposers) {
        dispose();
      }
    }
  }
  const interval = (
    // TODO: #334 Replace with idle callback strategy.
    setInterval(detectAndDispose, 1e3)
  );
  disposers.push(() => clearInterval(interval));
  if (
    // Implies that `DOMContentLoaded` has not yet fired.
    document.readyState === "loading"
  ) {
    document.addEventListener("DOMContentLoaded", detectAndDispose, { once: true });
    disposers.push(() => document.removeEventListener("DOMContentLoaded", detectAndDispose));
  }
  if (
    // If the `complete` state has been reached, we're too late.
    document.readyState !== "complete"
  ) {
    window.addEventListener("load", detectAndDispose, { once: true });
    disposers.push(() => window.removeEventListener("load", detectAndDispose));
  }
  detectAndDispose();
}
function isIosAndRedirectable() {
  if (!navigator)
    return false;
  const userAgent = navigator.userAgent.toLowerCase();
  const isIos = userAgent.includes("iphone") || userAgent.includes("ipad");
  const isSafari = userAgent.includes("safari");
  return isIos && isSafari;
}
function isVersionedTransaction(transaction) {
  return "version" in transaction;
}
class BaseSignerWalletAdapter extends BaseWalletAdapter {
  async sendTransaction(transaction, connection, options = {}) {
    let emit = true;
    try {
      if (isVersionedTransaction(transaction)) {
        if (!this.supportedTransactionVersions)
          throw new WalletSendTransactionError(`Sending versioned transactions isn't supported by this wallet`);
        if (!this.supportedTransactionVersions.has(transaction.version))
          throw new WalletSendTransactionError(`Sending transaction version ${transaction.version} isn't supported by this wallet`);
        try {
          transaction = await this.signTransaction(transaction);
          const rawTransaction = transaction.serialize();
          return await connection.sendRawTransaction(rawTransaction, options);
        } catch (error) {
          if (error instanceof WalletSignTransactionError) {
            emit = false;
            throw error;
          }
          throw new WalletSendTransactionError(error?.message, error);
        }
      } else {
        try {
          const { signers, ...sendOptions } = options;
          transaction = await this.prepareTransaction(transaction, connection, sendOptions);
          signers?.length && transaction.partialSign(...signers);
          transaction = await this.signTransaction(transaction);
          const rawTransaction = transaction.serialize();
          return await connection.sendRawTransaction(rawTransaction, sendOptions);
        } catch (error) {
          if (error instanceof WalletSignTransactionError) {
            emit = false;
            throw error;
          }
          throw new WalletSendTransactionError(error?.message, error);
        }
      }
    } catch (error) {
      if (emit) {
        this.emit("error", error);
      }
      throw error;
    }
  }
  async signAllTransactions(transactions) {
    for (const transaction of transactions) {
      if (isVersionedTransaction(transaction)) {
        if (!this.supportedTransactionVersions)
          throw new WalletSignTransactionError(`Signing versioned transactions isn't supported by this wallet`);
        if (!this.supportedTransactionVersions.has(transaction.version))
          throw new WalletSignTransactionError(`Signing transaction version ${transaction.version} isn't supported by this wallet`);
      }
    }
    const signedTransactions = [];
    for (const transaction of transactions) {
      signedTransactions.push(await this.signTransaction(transaction));
    }
    return signedTransactions;
  }
}
class BaseMessageSignerWalletAdapter extends BaseSignerWalletAdapter {
}
class BaseSignInMessageSignerWalletAdapter extends BaseMessageSignerWalletAdapter {
}
function isWalletAdapterCompatibleStandardWallet(wallet) {
  return StandardConnect in wallet.features && StandardEvents in wallet.features && (SolanaSignAndSendTransaction in wallet.features || SolanaSignTransaction in wallet.features);
}
export {
  BaseSignInMessageSignerWalletAdapter as B,
  WalletError as W,
  WalletReadyState as a,
  WalletNotReadyError as b,
  WalletNotConnectedError as c,
  WalletPublicKeyError as d,
  WalletConnectionError as e,
  WalletSignMessageError as f,
  WalletSendTransactionError as g,
  WalletSignTransactionError as h,
  BaseWalletAdapter as i,
  WalletDisconnectedError as j,
  WalletDisconnectionError as k,
  WalletAccountError as l,
  WalletConfigError as m,
  isVersionedTransaction as n,
  WalletSignInError as o,
  isWalletAdapterCompatibleStandardWallet as p,
  BaseMessageSignerWalletAdapter as q,
  isIosAndRedirectable as r,
  scopePollingDetectionStrategy as s,
  WalletLoadError as t
};
