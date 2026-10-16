# Optional confirmed scene direction bridge

This branch adds an optional public bridge for Inventory and Eule. It works without either extension: their files are never imported. Existing user prompt profiles are preserved.

`RPGStateTracker.sceneDirection.acquire()` is preferred, otherwise `EuleSceneDirection.acquire()`. A snapshot contains a bounded `text`, an opaque `key`, and `isCurrent()`. Inventory owns the main-model constraints prompt; Director adds the same constraints to its existing planning request, once. `report({key,status,text})` optionally exposes delivery status and the returned outline in Inventory's diagnostics. No extra planning calls per concurrent strand.

Confirmed constraints outrank creative planning preferences. Any number of confirmed physical scenes, telephone calls and private mental views share a time anchor. Follow the confirmed novel/dialogue style and single-focus or brief multi-strand coverage. “Zeitgleich” switches concurrent views without advancing time twice; calls do not imply co-location or shared private knowledge. This never authorizes player actions or exposes mental dialogue to physical participants. No RPG writes, time commits or new knowledge grants are performed by this integration. Model compliance is not guaranteed by prompt construction alone.

Stored outlines are reusable only when `directorDirectionKey` matches current constraints. Legacy outlines remain readable. Context changes and stop events retire active leases; stale asynchronous results are rejected and pending injections are cleared. Oversized confirmed constraints fail the planning request rather than being silently truncated. Inventory's direct main-model constraints remain available if Director has no connection.

Run `node --test tests/scene-direction.test.mjs`. Tests exercise the actual message builder/orchestration with a simulated provider: confirmed constraints, repeat generation, one-call concurrent planning, stale results, optional providers, cancellation and insufficient context budget.

This is an integration branch in a fork, not a claim of acceptance by upstream. Update the existing Director checkout only after checking local changes; do not install a second active copy. Version: 0.13.1. Existing Eule must also be updated for its confirmed handoff; updating Inventory alone is insufficient.
