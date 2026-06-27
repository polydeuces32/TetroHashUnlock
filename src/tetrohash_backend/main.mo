import Array "mo:base/Array";
import Principal "mo:base/Principal";

persistent actor TetroHashBackend {
  type PlayerProfile = {
    owner : Principal;
    username : ?Text;
    highScore : Nat;
    highestLevel : Nat;
    gamesPlayed : Nat;
    totalLinesCleared : Nat;
    achievements : [Text];
  };

  var totalPlays : Nat = 0;
  var anonymousPlays : Nat = 0;
  var authenticatedPlays : Nat = 0;
  var profiles : [(Principal, PlayerProfile)] = [];

  func replaceProfile(index : Nat, profile : PlayerProfile) : () {
    profiles := Array.tabulate<(Principal, PlayerProfile)>(
      profiles.size(),
      func (i : Nat) : (Principal, PlayerProfile) {
        if (i == index) {
          (profile.owner, profile)
        } else {
          profiles[i]
        }
      },
    );
  };

  func isAnonymousCaller(caller : Principal) : Bool {
    Principal.isAnonymous(caller)
  };

  func findProfileIndex(caller : Principal) : ?Nat {
    var index : Nat = 0;

    label search for ((owner, _) in profiles.vals()) {
      if (owner == caller) {
        return ?index;
      };
      index += 1;
    };

    null
  };

  func makeProfile(
    caller : Principal,
    username : ?Text,
    highScore : Nat,
    highestLevel : Nat,
    gamesPlayed : Nat,
    totalLinesCleared : Nat,
    achievements : [Text],
  ) : PlayerProfile {
    {
      owner = caller;
      username = username;
      highScore = highScore;
      highestLevel = highestLevel;
      gamesPlayed = gamesPlayed;
      totalLinesCleared = totalLinesCleared;
      achievements = achievements;
    }
  };

  public shared ({ caller }) func record_play() : async Nat {
    totalPlays += 1;

    if (Principal.isAnonymous(caller)) {
      anonymousPlays += 1;
    } else {
      authenticatedPlays += 1;
    };

    totalPlays
  };

  public query func get_total_plays() : async Nat {
    totalPlays
  };

  public query func get_play_stats() : async {
    totalPlays : Nat;
    anonymousPlays : Nat;
    authenticatedPlays : Nat;
  } {
    {
      totalPlays = totalPlays;
      anonymousPlays = anonymousPlays;
      authenticatedPlays = authenticatedPlays;
    }
  };

  public shared query ({ caller }) func whoami() : async Principal {
    caller
  };

  public query ({ caller }) func get_my_profile() : async ?PlayerProfile {
    switch (findProfileIndex(caller)) {
      case (?index) { ?profiles[index].1 };
      case null { null };
    }
  };

  public shared ({ caller }) func upsert_my_profile(username : ?Text) : async ?PlayerProfile {
    if (isAnonymousCaller(caller)) {
      return null;
    };

    let existing = switch (findProfileIndex(caller)) {
      case (?index) { ?profiles[index].1 };
      case null { null };
    };

    let profile = switch (existing) {
      case (?current) {
        makeProfile(
          caller,
          switch (username) {
            case (?value) { ?value };
            case null { current.username };
          },
          current.highScore,
          current.highestLevel,
          current.gamesPlayed,
          current.totalLinesCleared,
          current.achievements,
        );
      };
      case null {
        makeProfile(caller, username, 0, 0, 0, 0, []);
      };
    };

    switch (findProfileIndex(caller)) {
      case (?index) { replaceProfile(index, profile); };
      case null { profiles := Array.tabulate<(Principal, PlayerProfile)>(
        profiles.size() + 1,
        func (i : Nat) : (Principal, PlayerProfile) {
          if (i < profiles.size()) {
            profiles[i]
          } else {
            (caller, profile)
          }
        },
      ); };
    };

    ?profile
  };

  public shared ({ caller }) func update_my_score(
    highScore : Nat,
    highestLevel : Nat,
    gamesPlayed : Nat,
    totalLinesCleared : Nat,
    achievements : [Text],
  ) : async ?PlayerProfile {
    if (isAnonymousCaller(caller)) {
      return null;
    };

    let index = switch (findProfileIndex(caller)) {
      case (?value) { value };
      case null { return null; };
    };

    let current = profiles[index].1;
    let updated = makeProfile(
      caller,
      current.username,
      highScore,
      highestLevel,
      gamesPlayed,
      totalLinesCleared,
      achievements,
    );

    replaceProfile(index, updated);
    ?updated
  };

  public shared ({ caller }) func delete_my_profile() : async Bool {
    if (isAnonymousCaller(caller)) {
      return false;
    };

    switch (findProfileIndex(caller)) {
      case (?index) {
        let remaining = Array.tabulate<(Principal, PlayerProfile)>(
          profiles.size() - 1,
          func (i : Nat) : (Principal, PlayerProfile) {
            if (i < index) {
              profiles[i]
            } else {
              profiles[i + 1]
            }
          },
        );
        profiles := remaining;
        true
      };
      case null { false };
    };
  };
}
