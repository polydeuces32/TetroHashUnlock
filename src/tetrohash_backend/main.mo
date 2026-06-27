import Principal "mo:base/Principal";

persistent actor TetroHashBackend {
  var totalPlays : Nat = 0;
  var anonymousPlays : Nat = 0;
  var authenticatedPlays : Nat = 0;

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
}
