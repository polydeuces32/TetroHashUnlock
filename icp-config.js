// Runtime ICP configuration.
//
// Local deployment:
// 1. Run `dfx deploy`.
// 2. Run `dfx canister id tetrohash_backend`.
// 3. Replace the placeholder below with that backend canister ID.
//
// Mainnet deployment:
// Replace the same value with the ICP mainnet backend canister ID.

window.TETROHASH_ICP_CONFIG = {
  backendCanisterId: "REPLACE_WITH_TETROHASH_BACKEND_CANISTER_ID",
  localHost: "http://127.0.0.1:4943",
};
