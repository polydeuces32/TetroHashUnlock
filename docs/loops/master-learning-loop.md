# Master Learning Loop — TetroHashUnlock

## Purpose

Continuously improve TetroHashUnlock through structured observation, validation, learning, and safe iteration.

## Core Loop

1. Observe gameplay behavior
2. Detect weak areas
3. Review Bitcoin and SHA-256 learning content
4. Review AI assistant suggestions
5. Identify bugs, unclear UX, weak explanations, or missing features
6. Propose improvements
7. Validate changes manually and with tests
8. Record lessons learned
9. Update documentation
10. Repeat

## Project Focus

TetroHashUnlock should improve in these areas:

- gameplay clarity
- Bitcoin education accuracy
- SHA-256 explanation quality
- puzzle difficulty balance
- AI assistant usefulness
- reward logic safety
- frontend performance
- backend reliability
- documentation quality

## Safety Rules

- Do not auto-modify production code without human review.
- Do not claim Bitcoin rewards unless reward logic is actually implemented and verified.
- Do not store private keys, seed phrases, wallet secrets, or API keys in the repository.
- Do not merge changes until gameplay and learning behavior are tested.

## Output Format

Each loop cycle should produce:

- Observed issue
- Evidence
- Proposed fix
- Files affected
- Test steps
- Risk level
- Result
- Lesson learned

## Example Cycle

Observed issue:
The AI assistant gives unclear SHA-256 explanations.

Evidence:
User gets stuck after reading the explanation.

Proposed fix:
Add simpler explanation, visual example, and one practice prompt.

Files affected:
- learning.js
- index.html
- docs/loops/master-learning-loop.md

Test steps:
1. Open the game locally.
2. Trigger Learning Mode.
3. Read SHA-256 explanation.
4. Confirm the explanation is understandable without prior cryptography knowledge.

Risk level:
Low

Lesson learned:
Educational explanations should be short, visual, and tied directly to gameplay.
