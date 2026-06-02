import { P as PublicKey, V as VersionedMessage, T as Transaction, a as VersionedTransaction } from "../solana__web3.js.mjs";
import { S as SolanaMobileWalletAdapterWalletName$1, c as createDefaultAuthorizationCache, L as LocalSolanaMobileWalletAdapterWallet, a as createDefaultChainSelector, d as defaultErrorModalWalletNotFoundHandler } from "./wallet-standard-mobile+[...].mjs";
import { B as BaseSignInMessageSignerWalletAdapter, a as WalletReadyState, d as WalletPublicKeyError, b as WalletNotReadyError, e as WalletConnectionError, f as WalletSignMessageError, g as WalletSendTransactionError, c as WalletNotConnectedError, h as WalletSignTransactionError, W as WalletError } from "../solana__wallet-adapter-base.mjs";
import { a as StandardEvents, S as StandardConnect, b as StandardDisconnect } from "../wallet-standard__features.mjs";
import { b as SolanaSignIn, c as SolanaSignMessage, S as SolanaSignAndSendTransaction, a as SolanaSignTransaction } from "../@solana/wallet-standard-features+[...].mjs";
function fromUint8Array(byteArray) {
  return window.btoa(String.fromCharCode.call(null, ...byteArray));
}
function getIsSupported() {
  return typeof window !== "undefined" && window.isSecureContext && typeof document !== "undefined" && /android/i.test(navigator.userAgent);
}
const SolanaMobileWalletAdapterWalletName = SolanaMobileWalletAdapterWalletName$1;
const SIGNATURE_LENGTH_IN_BYTES = 64;
function isVersionedTransaction(transaction) {
  return "version" in transaction;
}
function chainOrClusterToChainId(chain) {
  switch (chain) {
    case "mainnet-beta":
      return "solana:mainnet";
    case "testnet":
      return "solana:testnet";
    case "devnet":
      return "solana:devnet";
    default:
      return chain;
  }
}
function getErrorMessage(error) {
  return error instanceof Error ? error.message : "Unknown error";
}
var BaseSolanaMobileWalletAdapter = class extends BaseSignInMessageSignerWalletAdapter {
  supportedTransactionVersions = /* @__PURE__ */ new Set(["legacy", 0]);
  name;
  icon;
  url;
  #wallet;
  #connecting = false;
  #readyState = getIsSupported() ? WalletReadyState.Loadable : WalletReadyState.Unsupported;
  #accountSelector;
  #selectedAccount;
  #publicKey;
  #handleChangeEvent = async (properties) => {
    if (properties.accounts && properties.accounts.length > 0) {
      this.#declareWalletAsInstalled();
      const nextSelectedAccount = await this.#accountSelector(properties.accounts);
      if (nextSelectedAccount !== this.#selectedAccount) {
        this.#selectedAccount = nextSelectedAccount;
        this.#publicKey = void 0;
        this.emit("connect", this.publicKey);
      }
    }
  };
  constructor(wallet, config) {
    super();
    this.#accountSelector = async (accounts) => {
      const selectedBase64EncodedAddress = await config.addressSelector.select(accounts.map(({ publicKey }) => fromUint8Array(new Uint8Array(publicKey))));
      return accounts.find(({ publicKey }) => fromUint8Array(new Uint8Array(publicKey)) === selectedBase64EncodedAddress) ?? accounts[0];
    };
    this.#wallet = wallet;
    this.#wallet.features[StandardEvents].on("change", this.#handleChangeEvent);
    this.name = this.#wallet.name;
    this.icon = this.#wallet.icon;
    this.url = this.#wallet.url;
  }
  get publicKey() {
    if (!this.#publicKey && this.#selectedAccount) try {
      this.#publicKey = new PublicKey(this.#selectedAccount.publicKey);
    } catch (e) {
      throw new WalletPublicKeyError(e instanceof Error && e?.message || "Unknown error", e);
    }
    return this.#publicKey ?? null;
  }
  get connected() {
    return this.#wallet.connected;
  }
  get connecting() {
    return this.#connecting;
  }
  get readyState() {
    return this.#readyState;
  }
  /** @deprecated Use `autoConnect()` instead. */
  async autoConnect_DO_NOT_USE_OR_YOU_WILL_BE_FIRED() {
    return await this.autoConnect();
  }
  async autoConnect() {
    this.#connect(true);
  }
  async connect() {
    this.#connect();
  }
  async #connect(autoConnect = false) {
    if (this.connecting || this.connected) return;
    return await this.#runWithGuard(async () => {
      if (this.#readyState !== WalletReadyState.Installed && this.#readyState !== WalletReadyState.Loadable) throw new WalletNotReadyError();
      this.#connecting = true;
      try {
        await this.#wallet.features[StandardConnect].connect({ silent: autoConnect });
      } catch (e) {
        throw new WalletConnectionError(e instanceof Error && e.message || "Unknown error", e);
      } finally {
        this.#connecting = false;
      }
    });
  }
  /** @deprecated Use `connect()` or `autoConnect()` instead. */
  async performAuthorization(signInPayload) {
    try {
      const cachedAuthorizationResult = await this.#wallet.cachedAuthorizationResult;
      if (cachedAuthorizationResult) {
        await this.#wallet.features[StandardConnect].connect({ silent: true });
        return cachedAuthorizationResult;
      }
      if (signInPayload) await this.#wallet.features[SolanaSignIn].signIn(signInPayload);
      else await this.#wallet.features[StandardConnect].connect();
      return await await this.#wallet.cachedAuthorizationResult;
    } catch (e) {
      throw new WalletConnectionError(e instanceof Error && e.message || "Unknown error", e);
    }
  }
  async disconnect() {
    return await this.#runWithGuard(async () => {
      this.#connecting = false;
      this.#publicKey = void 0;
      this.#selectedAccount = void 0;
      await this.#wallet.features[StandardDisconnect].disconnect();
      this.emit("disconnect");
    });
  }
  async signIn(input) {
    return this.#runWithGuard(async () => {
      if (this.#readyState !== WalletReadyState.Installed && this.#readyState !== WalletReadyState.Loadable) throw new WalletNotReadyError();
      this.#connecting = true;
      try {
        const outputs = await this.#wallet.features[SolanaSignIn].signIn({
          ...input,
          domain: input?.domain ?? window.location.host
        });
        if (outputs.length > 0) return outputs[0];
        else throw new Error("Sign in failed, no sign in result returned by wallet");
      } catch (e) {
        throw new WalletConnectionError(e instanceof Error && e.message || "Unknown error", e);
      } finally {
        this.#connecting = false;
      }
    });
  }
  async signMessage(message) {
    return await this.#runWithGuard(async () => {
      const account = this.#assertIsAuthorized();
      try {
        return (await this.#wallet.features[SolanaSignMessage].signMessage({
          account,
          message
        }))[0].signature;
      } catch (error) {
        throw new WalletSignMessageError(getErrorMessage(error), error);
      }
    });
  }
  async sendTransaction(transaction, connection, options) {
    return await this.#runWithGuard(async () => {
      const account = this.#assertIsAuthorized();
      try {
        let getTargetCommitment = function() {
          let targetCommitment;
          switch (connection.commitment) {
            case "confirmed":
            case "finalized":
            case "processed":
              targetCommitment = connection.commitment;
              break;
            default:
              targetCommitment = "finalized";
          }
          let targetPreflightCommitment;
          switch (options?.preflightCommitment) {
            case "confirmed":
            case "finalized":
            case "processed":
              targetPreflightCommitment = options.preflightCommitment;
              break;
            case void 0:
              targetPreflightCommitment = targetCommitment;
              break;
            default:
              targetPreflightCommitment = "finalized";
          }
          return (targetPreflightCommitment === "finalized" ? 2 : targetPreflightCommitment === "confirmed" ? 1 : 0) < (targetCommitment === "finalized" ? 2 : targetCommitment === "confirmed" ? 1 : 0) ? targetPreflightCommitment : targetCommitment;
        };
        if (SolanaSignAndSendTransaction in this.#wallet.features) {
          const chain = chainOrClusterToChainId(this.#wallet.currentAuthorization.chain);
          const [signature] = (await this.#wallet.features[SolanaSignAndSendTransaction].signAndSendTransaction({
            account,
            transaction: transaction.serialize(),
            chain,
            options: options ? {
              skipPreflight: options.skipPreflight,
              maxRetries: options.maxRetries
            } : void 0
          })).map((output) => {
            return fromUint8Array(output.signature);
          });
          return signature;
        } else {
          const [signedTransaction] = await this.#performSignTransactions([transaction]);
          if (isVersionedTransaction(signedTransaction)) return await connection.sendTransaction(signedTransaction);
          else {
            const serializedTransaction = signedTransaction.serialize();
            return await connection.sendRawTransaction(serializedTransaction, {
              ...options,
              preflightCommitment: getTargetCommitment()
            });
          }
        }
      } catch (error) {
        throw new WalletSendTransactionError(getErrorMessage(error), error);
      }
    });
  }
  async signTransaction(transaction) {
    return await this.#runWithGuard(async () => {
      const [signedTransaction] = await this.#performSignTransactions([transaction]);
      return signedTransaction;
    });
  }
  async signAllTransactions(transactions) {
    return await this.#runWithGuard(async () => {
      return await this.#performSignTransactions(transactions);
    });
  }
  #declareWalletAsInstalled() {
    if (this.#readyState !== WalletReadyState.Installed) this.emit("readyStateChange", this.#readyState = WalletReadyState.Installed);
  }
  #assertIsAuthorized() {
    if (!this.#wallet.isAuthorized || !this.#selectedAccount) throw new WalletNotConnectedError();
    return this.#selectedAccount;
  }
  async #performSignTransactions(transactions) {
    const account = this.#assertIsAuthorized();
    try {
      if (SolanaSignTransaction in this.#wallet.features) return this.#wallet.features[SolanaSignTransaction].signTransaction(...transactions.map((value) => {
        return {
          account,
          transaction: value.serialize()
        };
      })).then((outputs) => {
        return outputs.map((output) => {
          const byteArray = output.signedTransaction;
          const messageOffset = byteArray[0] * SIGNATURE_LENGTH_IN_BYTES + 1;
          if (VersionedMessage.deserializeMessageVersion(byteArray.slice(messageOffset, byteArray.length)) === "legacy") return Transaction.from(byteArray);
          else return VersionedTransaction.deserialize(byteArray);
        });
      });
      else throw new Error("Connected wallet does not support signing transactions");
    } catch (error) {
      throw new WalletSignTransactionError(getErrorMessage(error), error);
    }
  }
  async #runWithGuard(callback) {
    try {
      return await callback();
    } catch (e) {
      this.emit("error", e instanceof WalletError ? e : new WalletError(getErrorMessage(e), e));
      throw e;
    }
  }
};
var LocalSolanaMobileWalletAdapter = class extends BaseSolanaMobileWalletAdapter {
  constructor(config) {
    const chain = chainOrClusterToChainId(config.chain ?? config.cluster);
    super(new LocalSolanaMobileWalletAdapterWallet({
      appIdentity: config.appIdentity,
      authorizationCache: {
        set: config.authorizationResultCache.set,
        get: async () => {
          return await config.authorizationResultCache.get();
        },
        clear: config.authorizationResultCache.clear
      },
      chains: [chain],
      chainSelector: createDefaultChainSelector(),
      onWalletNotFound: async () => {
        config.onWalletNotFound(this);
      }
    }), {
      addressSelector: config.addressSelector,
      chain
    });
  }
};
var SolanaMobileWalletAdapter = class extends LocalSolanaMobileWalletAdapter {
};
function createDefaultAddressSelector() {
  return { async select(addresses) {
    return addresses[0];
  } };
}
function createDefaultAuthorizationResultCache() {
  return createDefaultAuthorizationCache();
}
async function defaultWalletNotFoundHandler(_mobileWalletAdapter) {
  return defaultErrorModalWalletNotFoundHandler();
}
function createDefaultWalletNotFoundHandler() {
  return defaultWalletNotFoundHandler;
}
export {
  SolanaMobileWalletAdapterWalletName as S,
  SolanaMobileWalletAdapter as a,
  createDefaultAuthorizationResultCache as b,
  createDefaultWalletNotFoundHandler as c,
  createDefaultAddressSelector as d
};
