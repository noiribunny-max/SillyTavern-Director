import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { acquireSceneDirection, assertSceneDirection, directionInstruction, outlineMatches, invalidateSceneDirection } from '../src/sceneDirection.mjs';

function fixture() {
    let current = true, calls = 0;
    const chat = [{ mes: 'Vor dem Zeitsprung', is_user: true }, { mes: 'Alter Verlauf', director: 'Alter Plan' }];
    const direction = { key: 'new-confirmed', text: 'Bestätigter Zeitsprung. Naruto/Sasuke außen; Mitsuki/Vorthax privat.', isCurrent: () => current, report() {} };
    const ctx = { extensionPrompts: {}, maxContext: 8000, extensionSettings: { connectionManager: { selectedProfile: 'main' } },
        ConnectionManagerRequestService: { getProfile: () => ({ id: 'main', mode: 'cc' }), sendRequest: async () => { calls++; return { content: 'Plan' }; } } };
    const sandbox = { chat, getContext: () => ctx, extensionSettings: { selectedProfile: 'current', directorPrompt: 'One beat', responseLength: 1000 },
        extension_prompt_types: { IN_CHAT: 1, IN_PROMPT: 0 }, debug() {}, warn() {}, acquireSceneDirection: () => direction,
        assertSceneDirection, directionInstruction, deactivateSendButtons() {}, activateSendButtons() {}, $: () => ({ css: () => 'block' }),
        getLastNonSystemMessageIndex: () => chat.length - 1, getPreviousNonSystemMessageIndex: i => i - 1,
        chat_metadata: {}, saveChatConditional: async () => {}, setExtensionPrompt: async (...args) => injected.push(args),
        getExtensionPromptRoleByName: () => 0, DirectorPreviewManager: { updatePreview() {} }, outlineMatches };
    const injected = [];
    vm.createContext(sandbox);
    for (const name of ['generation', 'director']) {
        const source = fs.readFileSync(new URL(`../src/${name}.js`, import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
        vm.runInContext(source, sandbox);
    }
    return { sandbox, direction, injected, chat, calls: () => calls, retire: () => { current = false; } };
}
test('actual Director builder includes confirmed constraints once, even when only extension prompts hold them', async () => {
    const f = fixture();
    const messages = await vm.runInContext('buildDirectorMessages(getContext(),1,{contextSize:8000,responseTokens:1000},"",acquireSceneDirection())', f.sandbox);
    const text = messages.map(m => m.content).join('\n');
    assert.equal(text.split(f.direction.text).length - 1, 1);
    assert.match(text, /Zeitgleich/); assert.match(text, /Leave all player responses open/);
});
test('continue, regenerate and swipe discard legacy plans and make one call for both threads', async () => {
    for (const type of ['continue', 'regenerate', 'swipe']) {
        const f = fixture();
        await vm.runInContext(`prepareDirector('${type}',{})`, f.sandbox);
        assert.equal(f.calls(), 1); assert.equal(f.chat[1].directorDirectionKey, f.direction.key);
        assert.ok(!f.injected.at(-1)[1].includes('Alter Plan'));
        await vm.runInContext(`prepareDirector('${type}',{})`, f.sandbox);
        assert.equal(f.calls(), 1);
    }
});
test('retired binding rejects asynchronous results and clears old injection first', async () => {
    const f = fixture();
    f.sandbox.getContext().ConnectionManagerRequestService.sendRequest = async () => { f.retire(); return { content: 'wrong chat' }; };
    await assert.rejects(vm.runInContext('prepareDirector(undefined,{})', f.sandbox), /STALE/);
    assert.equal(f.injected.at(-1)[1], '');
    assert.equal(f.sandbox.chat_metadata.director.pendingOutline, null);
});
test('bridge is optional; unavailable and disabled providers do not cause extra calls', () => {
    assert.equal(acquireSceneDirection(), null);
    assert.equal(directionInstruction(null), ''); assert.equal(outlineMatches({ director: 'legacy' }, null), true);
    globalThis.EuleSceneDirection = { acquire: () => ({ key: 'eule', text: 'Skip', isCurrent: () => true }) };
    try {
        const lease = acquireSceneDirection(); assert.equal(lease.text, 'Skip');
        invalidateSceneDirection(); assert.throws(() => assertSceneDirection(lease), /STALE/);
    } finally { delete globalThis.EuleSceneDirection; }
});
test('confirmed constraints cannot silently overflow a small Director context budget', async () => {
    const f = fixture(); f.sandbox.extensionSettings.contextSize = 300;
    await assert.rejects(vm.runInContext('prepareDirector(undefined,{})', f.sandbox), /CONTEXT_BUDGET/);
    assert.equal(f.calls(), 0); assert.equal(f.injected.at(-1)[1], '');
});

test('bridge honors arbitrary strand focus and dialogue style without imposing outer-first ordering',()=>{
 const text=directionInstruction({text:'dialogue; focus phone; several physical strands'});
 assert.match(text,/Honor the confirmed narrative style, strand coverage and focus/);assert.match(text,/separate knowledge and location scopes/);assert.doesNotMatch(text,/present the outer scene first/);
});
