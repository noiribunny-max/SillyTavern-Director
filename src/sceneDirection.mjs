// Optional public bridge. No dependency on either extension's files or private state.
let epoch = 0;
export function invalidateSceneDirection() { epoch++; }
export function acquireSceneDirection() {
    const provider = globalThis.RPGStateTracker?.sceneDirection ?? globalThis.EuleSceneDirection;
    const value = provider?.acquire?.();
    if (!value) return null;
    if (typeof value.key !== 'string' || typeof value.text !== 'string' || value.text.length > 24000
        || typeof value.isCurrent !== 'function' || !value.isCurrent()) throw Error('SCENE_DIRECTION_INVALID');
    const acquiredEpoch = epoch;
    return Object.freeze({ ...value, isCurrent: () => epoch === acquiredEpoch && value.isCurrent(),
        report: status => provider?.report?.({ key: value.key, ...status }) });
}
export function assertSceneDirection(value) {
    if (value && !value.isCurrent()) throw Error('SCENE_DIRECTION_STALE');
}
export function directionInstruction(value) {
    return value ? '\n\nAuthoritative confirmed user constraints (override creative planning preferences; never override player agency or knowledge boundaries):\n'
        + value.text + '\nPlan these concurrent strands in ONE request and ONE shared time beat. Honor the confirmed narrative style, strand coverage and focus. Treat physical scenes, calls and private inner dialogues as separate knowledge and location scopes. Use “Zeitgleich” for concurrent views without advancing time twice. Leave all player responses open. Never report a narrative time skip as committed inventory time.\n' : '';
}
export function outlineMatches(message, direction) {
    return (message?.directorDirectionKey ?? null) === (direction?.key ?? null);
}
