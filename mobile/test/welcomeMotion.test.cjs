const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
  let focus, resolvePreference;
  const listeners = {}, loops = [], values = [];
  const phase = { setValue: value => values.push(value) };
  const subscribe = name => (event, callback) => {
    listeners[name] = callback;
    return { remove: () => { delete listeners[name]; } };
  };
  const appState = { currentState: 'active', addEventListener: subscribe('app') };
  const context = {
    useRef: () => ({ current: phase }),
    useCallback: callback => callback,
    useFocusEffect: callback => { focus = callback; },
    AccessibilityInfo: {
      addEventListener: subscribe('motion'),
      isReduceMotionEnabled: () => new Promise(resolve => { resolvePreference = resolve; }),
    },
    AppState: appState,
    Easing: { linear: 'linear' },
    Animated: {
      Value: function () { return phase; },
      timing: (value, options) => {
        assert.equal(value, phase);
        assert.equal(options.useNativeDriver, true);
        assert.equal(options.isInteraction, false);
        return options;
      },
      loop: () => {
        const loop = { started: false, stopped: false, start() { this.started = true; }, stop() { this.stopped = true; } };
        loops.push(loop);
        return loop;
      },
    },
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/hooks/useWelcomeMotion.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function');
  vm.runInNewContext(source + '\nuseWelcomeMotion();', context);
  const blur = focus();
  return { blur, listeners, loops, values, appState, resolvePreference };
}

test('welcome animation uses the native driver and stops with listeners removed on blur', async () => {
  const motion = setup();
  motion.resolvePreference(false);
  await Promise.resolve();
  assert.equal(motion.loops.length, 1);
  assert.equal(motion.loops[0].started, true);
  motion.blur();
  assert.equal(motion.loops[0].stopped, true);
  assert.deepEqual(Object.keys(motion.listeners), []);
});

test('reduced motion and background state show a static assembled scene', async () => {
  const motion = setup();
  motion.resolvePreference(true);
  await Promise.resolve();
  assert.equal(motion.loops.length, 0);
  assert.equal(motion.values.at(-1), 0.55);
  motion.listeners.motion(false);
  assert.equal(motion.loops.length, 1);
  motion.appState.currentState = 'background';
  motion.listeners.app();
  assert.equal(motion.loops[0].stopped, true);
  assert.equal(motion.values.at(-1), 0.55);
  motion.appState.currentState = 'active';
  motion.listeners.app();
  assert.equal(motion.loops.length, 2);
  motion.listeners.motion(true);
  assert.equal(motion.loops[1].stopped, true);
  assert.equal(motion.values.at(-1), 0.55);
  motion.blur();
});

test('a late motion preference result cannot restart an unfocused welcome screen', async () => {
  const motion = setup();
  motion.blur();
  motion.resolvePreference(false);
  await Promise.resolve();
  assert.equal(motion.loops.length, 0);
});

test('a preference change takes priority over an older pending preference read', async () => {
  const motion = setup();
  motion.listeners.motion(true);
  motion.resolvePreference(false);
  await Promise.resolve();
  assert.equal(motion.loops.length, 0);
  assert.equal(motion.values.at(-1), 0.55);
  motion.blur();
});
