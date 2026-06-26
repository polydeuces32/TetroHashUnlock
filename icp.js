const ICP_CONFIG = window.TETROHASH_ICP_CONFIG || {};
const PLACEHOLDER_CANISTER_ID = "REPLACE_WITH_TETROHASH_BACKEND_CANISTER_ID";

const idlFactory = ({ IDL }) => {
  return IDL.Service({
    get_play_stats: IDL.Func(
      [],
      [
        IDL.Record({
          totalPlays: IDL.Nat,
          anonymousPlays: IDL.Nat,
          authenticatedPlays: IDL.Nat,
        }),
      ],
      ["query"],
    ),
    get_total_plays: IDL.Func([], [IDL.Nat], ["query"]),
    record_play: IDL.Func([], [IDL.Nat], []),
    whoami: IDL.Func([], [IDL.Principal], ["query"]),
  });
};

function isLikelyLocalReplica() {
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function getStatusElement() {
  return document.getElementById("icpStatus");
}

function setStatus(message) {
  const status = getStatusElement();
  if (status) status.textContent = message;
}

async function createBackendActor() {
  const backendCanisterId = ICP_CONFIG.backendCanisterId;

  if (!backendCanisterId || backendCanisterId === PLACEHOLDER_CANISTER_ID) {
    throw new Error("Missing tetrohash_backend canister ID in icp-config.js");
  }

  const [{ Actor, HttpAgent }] = await Promise.all([
    import("https://esm.sh/@dfinity/agent@2.4.1"),
  ]);

  const agentOptions = isLikelyLocalReplica()
    ? { host: ICP_CONFIG.localHost || "http://127.0.0.1:4943" }
    : {};

  const agent = new HttpAgent(agentOptions);

  if (isLikelyLocalReplica()) {
    await agent.fetchRootKey();
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: backendCanisterId,
  });
}

let backendPromise = null;

async function getBackend() {
  if (!backendPromise) backendPromise = createBackendActor();
  return backendPromise;
}

async function recordPlay() {
  try {
    const backend = await getBackend();
    const total = await backend.record_play();
    const totalText = total.toString();
    setStatus(`ICP connected — total plays recorded: ${totalText}`);
    return totalText;
  } catch (error) {
    console.warn("ICP record_play failed:", error);
    setStatus("ICP backend not connected yet. Update icp-config.js after dfx deploy.");
    return null;
  }
}

async function refreshStats() {
  try {
    const backend = await getBackend();
    const stats = await backend.get_play_stats();
    setStatus(
      `ICP connected — total: ${stats.totalPlays.toString()}, anonymous: ${stats.anonymousPlays.toString()}, authenticated: ${stats.authenticatedPlays.toString()}`,
    );
    return stats;
  } catch (error) {
    console.warn("ICP get_play_stats failed:", error);
    setStatus("ICP backend not connected yet. Update icp-config.js after dfx deploy.");
    return null;
  }
}

window.TetroHashICP = {
  recordPlay,
  refreshStats,
};

document.addEventListener("DOMContentLoaded", () => {
  refreshStats();
});
