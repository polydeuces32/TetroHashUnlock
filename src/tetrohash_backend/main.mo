import Principal "mo:base/Principal";

actor TetroHashBackend {
  stable var totalPlays : Nat = 0;

  public shared ({ caller }) func record_play() : async Nat {
    assert not Principal.isAnonymous(caller);
    totalPlays += 1;
    totalPlays
  };

  public query func get_total_plays() : async Nat {
    totalPlays
  };

  public shared query ({ caller }) func whoami() : async Principal {
    caller
  };
}
