import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";

const ICP_CONFIG = window.TETROHASH_ICP_CONFIG || {};
const PLACEHOLDER_CANISTER_ID = "REPLACE_WITH_TETROHASH_BACKEND_CANISTER_ID";
const MAX_SESSION_NS = BigInt(8 * 60 * 60) * 1_000_000_000n;

const idlFactory = ({ IDL }) => {
  const profile = IDL.Record({
    owner: IDL.Principal,
    username: IDL.Opt(IDL.Text),
    highScore: IDL.Nat,
    highestLevel: IDL.Nat,
    gamesPlayed: IDL.Nat,
    totalLinesCleared: IDL.Nat,
    achievements: IDL.Vec(IDL.Text),
  });

  return IDL.Service({
    get_play_stats: IDL.Func([], [IDL.Record({
      totalPlays: IDL.Nat,
      anonymousPlays: IDL.Nat,
      authenticatedPlays: IDL.Nat,
    })], ["query"]),
    get_total_plays: IDL.Func([], [IDL.Nat], ["query"]),
    record_play: IDL.Func([], [IDL.Nat], []),
    whoami: IDL.Func([], [IDL.Principal], ["query"]),
    get_my_profile: IDL.Func([], [IDL.Opt(profile)], ["query"]),
    upsert_my_profile: IDL.Func([IDL.Opt(IDL.Text)], [IDL.Opt(profile)], []),
    update_my_score: IDL.Func(
      [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Vec(IDL.Text)],
      [IDL.Opt(profile)],
      [],
    ),
    delete_my_profile: IDL.Func([], [IDL.Bool], []),
  });
};

function isLocalReplica() {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" ||
    hostname === "::1" || hostname.endsWith(".localhost");
}

function setStatus(message) {
  const status = document.getElementById("icpStatus");
  if (status) status.textContent = message;
}

function requireCanisterId() {
  const id = ICP_CONFIG.backendCanisterId;
  if (!id || id === PLACEHOLDER_CANISTER_ID) {
    throw new Error("Missing tetrohash_backend canister ID in icp-config.js");
  }
  return id;
}

let authClientPromise;
let actorPromise;

async function getAuthClient() {
  if (!authClientPromise) authClientPromise = AuthClient.create();
  return authClientPromise;
}

async function createBackendActor(identity) {
  const agent = new HttpAgent({
    ...(isLocalReplica() ? { host: ICP_CONFIG.localHost || "http://127.0.0.1:4943" } : {}),
    ...(identity ? { identity } : {}),
  });

  if (isLocalReplica()) await agent.fetchRootKey();

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: requireCanisterId(),
  });
}

async function getBackend() {
  if (!actorPromise) {
    actorPromise = getAuthClient().then(async (authClient) => {
      const identity = (await authClient.isAuthenticated())
        ? authClient.getIdentity()
        : undefined;
      return createBackendActor(identity);
    });
  }
  return actorPromise;
}

function resetActor() {
  actorPromise = undefined;
}

function unwrapOpt(value) {
  return Array.isArray(value) && value.length ? value[0] : null;
}

function normalizeProfile(profile) {
  if (!profile) return null;
  return {
    owner: profile.owner.toText(),
    username: unwrapOpt(profile.username),
    highScore: profile.highScore.toString(),
    highestLevel: profile.highestLevel.toString(),
    gamesPlayed: profile.gamesPlayed.toString(),
    totalLinesCleared: profile.totalLinesCleared.toString(),
    achievements: [...profile.achievements],
  };
}

async function login() {
  const authClient = await getAuthClient();
  await new Promise((resolve, reject) => {
    authClient.login({
      identityProvider: ICP_CONFIG.identityProvider,
      maxTimeToLive: MAX_SESSION_NS,
      onSuccess: resolve,
      onError: reject,
    });
  });
  resetActor();
  const principal = await whoami();
  setStatus(`ICP signed in — ${principal}`);
  return principal;
}

async function logout() {
  const authClient = await getAuthClient();
  await authClient.logout();
  resetActor();
  setStatus("ICP signed out.");
}

async function isAuthenticated() {
  return (await getAuthClient()).isAuthenticated();
}

async function whoami() {
  return (await (await getBackend()).whoami()).toText();
}

async function recordPlay() {
  try {
    const total = await (await getBackend()).record_play();
    setStatus(`ICP connected — total plays recorded: ${total.toString()}`);
    return total.toString();
  } catch (error) {
    console.warn("ICP record_play failed:", error);
    setStatus("ICP backend unavailable. Check canister configuration.");
    return null;
  }
}

async function refreshStats() {
  try {
    const stats = await (await getBackend()).get_play_stats();
    setStatus(`ICP connected — total: ${stats.totalPlays}, anonymous: ${stats.anonymousPlays}, authenticated: ${stats.authenticatedPlays}`);
    return stats;
  } catch (error) {
    console.warn("ICP get_play_stats failed:", error);
    setStatus("ICP backend unavailable. Check canister configuration.");
    return null;
  }
}

async function getMyProfile() {
  return normalizeProfile(unwrapOpt(await (await getBackend()).get_my_profile()));
}

async function upsertMyProfile(username) {
  const clean = typeof username === "string" ? username.trim() : "";
  const result = await (await getBackend()).upsert_my_profile(clean ? [clean] : []);
  return normalizeProfile(unwrapOpt(result));
}

async function updateMyScore({ highScore, highestLevel, gamesPlayed, totalLinesCleared, achievements = [] }) {
  const result = await (await getBackend()).update_my_score(
    BigInt(highScore),
    BigInt(highestLevel),
    BigInt(gamesPlayed),
    BigInt(totalLinesCleared),
    achievements.map(String),
  );
  return normalizeProfile(unwrapOpt(result));
}

async function deleteMyProfile() {
  return (await getBackend()).delete_my_profile();
}

function installAuthControls() {
  const status = document.getElementById("icpStatus");
  if (!status || document.getElementById("icpAuthControls")) return;

  const container = document.createElement("div");
  container.id = "icpAuthControls";
  container.style.display = "grid";
  container.style.gap = "0.5rem";
  container.style.marginTop = "0.75rem";

  const loginButton = document.createElement("button");
  loginButton.type = "button";
  loginButton.className = "button secondary full";
  loginButton.textContent = "Sign in with Internet Identity";
  loginButton.addEventListener("click", async () => {
    loginButton.disabled = true;
    try {
      await login();
    } catch (error) {
      console.error(error);
      setStatus("Internet Identity sign-in failed.");
    } finally {
      loginButton.disabled = false;
    }
  });

  const logoutButton = document.createElement("button");
  logoutButton.type = "button";
  logoutButton.className = "button secondary full";
  logoutButton.textContent = "Sign out";
  logoutButton.addEventListener("click", logout);

  container.append(loginButton, logoutButton);
  status.parentElement?.append(container);
}

window.TetroHashICP = {
  login,
  logout,
  isAuthenticated,
  whoami,
  recordPlay,
  refreshStats,
  getMyProfile,
  upsertMyProfile,
  updateMyScore,
  deleteMyProfile,
};

document.addEventListener("DOMContentLoaded", () => {
  installAuthControls();
  refreshStats();
});
