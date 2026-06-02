import { S as SOLANA_MAINNET_CHAIN, a as SOLANA_DEVNET_CHAIN, b as SOLANA_TESTNET_CHAIN, c as SOLANA_LOCALNET_CHAIN } from "./solana__wallet-standard-chains.mjs";
function getCommitment(commitment) {
  switch (commitment) {
    case "processed":
    case "confirmed":
    case "finalized":
    case void 0:
      return commitment;
    case "recent":
      return "processed";
    case "single":
    case "singleGossip":
      return "confirmed";
    case "max":
    case "root":
      return "finalized";
    default:
      return void 0;
  }
}
const MAINNET_ENDPOINT = "https://api.mainnet-beta.solana.com";
function getChainForEndpoint(endpoint) {
  if (endpoint.includes(MAINNET_ENDPOINT))
    return SOLANA_MAINNET_CHAIN;
  if (/\bdevnet\b/i.test(endpoint))
    return SOLANA_DEVNET_CHAIN;
  if (/\btestnet\b/i.test(endpoint))
    return SOLANA_TESTNET_CHAIN;
  if (/\blocalhost\b/i.test(endpoint) || /\b127\.0\.0\.1\b/.test(endpoint))
    return SOLANA_LOCALNET_CHAIN;
  return SOLANA_MAINNET_CHAIN;
}
function createSignInMessageText(input) {
  let message = `${input.domain} wants you to sign in with your Solana account:
`;
  message += `${input.address}`;
  if (input.statement) {
    message += `

${input.statement}`;
  }
  const fields = [];
  if (input.uri) {
    fields.push(`URI: ${input.uri}`);
  }
  if (input.version) {
    fields.push(`Version: ${input.version}`);
  }
  if (input.chainId) {
    fields.push(`Chain ID: ${input.chainId}`);
  }
  if (input.nonce) {
    fields.push(`Nonce: ${input.nonce}`);
  }
  if (input.issuedAt) {
    fields.push(`Issued At: ${input.issuedAt}`);
  }
  if (input.expirationTime) {
    fields.push(`Expiration Time: ${input.expirationTime}`);
  }
  if (input.notBefore) {
    fields.push(`Not Before: ${input.notBefore}`);
  }
  if (input.requestId) {
    fields.push(`Request ID: ${input.requestId}`);
  }
  if (input.resources) {
    fields.push(`Resources:`);
    for (const resource of input.resources) {
      fields.push(`- ${resource}`);
    }
  }
  if (fields.length) {
    message += `

${fields.join("\n")}`;
  }
  return message;
}
export {
  getCommitment as a,
  createSignInMessageText as c,
  getChainForEndpoint as g
};
