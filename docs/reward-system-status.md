# Reward System Status — TetroHashUnlock

## Current Status

TetroHashUnlock currently tracks in-game sats locally.

Real Bitcoin or Lightning withdrawals are not live.

## Confirmed Implementation

* Local SAT balance tracking exists.
* Reward history exists.
* Backend reward code exists.
* Lightning payout code exists as a disabled future integration.

## Disabled Features

* Real Lightning payouts are disabled.
* Real withdrawals are not enabled.
* Backend anti-cheat validation is not production-ready.
* No private keys, seed phrases, wallet secrets, or Lightning API keys should be stored in this repository.

## Source of Truth

backend/reward.py

ENABLE_LIGHTNING = False

## Product Language Rule

Use:

"Earn in-game sats"

Do not use:

"Earn real Bitcoin"

unless Lightning withdrawal, backend validation, anti-cheat controls, accounting, abuse prevention, and payout operations are fully implemented and tested.

