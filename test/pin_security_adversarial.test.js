import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { hashPin, verifyPin } from '../src/utils/crypto.js';

describe('Adversarial Verification: M2 PIN & Crypto Security Logic', () => {

  describe('1. Cryptographic Utility (src/utils/crypto.js)', () => {
    
    it('generates exact 64-character lowercase hex SHA-256 strings', async () => {
      const pins = ['1234', '0000', '9999', '0702', '2026', '5432'];
      const hexRegex = /^[0-9a-f]{64}$/;

      for (const pin of pins) {
        const hash = await hashPin(pin);
        assert.strictEqual(typeof hash, 'string');
        assert.strictEqual(hash.length, 64, `Hash length for "${pin}" must be exactly 64 characters`);
        assert.match(hash, hexRegex, `Hash for "${pin}" must strictly match lowercase hex format`);
      }
    });

    it('matches known standard NIST SHA-256 test vectors', async () => {
      // Known standard SHA-256 digests
      const testVectors = [
        { pin: '1234', expected: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4' },
        { pin: '0000', expected: '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0' },
        { pin: '', expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
      ];

      for (const { pin, expected } of testVectors) {
        const hash = await hashPin(pin);
        assert.strictEqual(hash, expected, `SHA-256 digest of "${pin}" must match standard NIST vector`);
      }
    });

    it('verifyPin returns true for correct PIN and false for incorrect PIN', async () => {
      const correctPin = '1234';
      const storedHash = await hashPin(correctPin);

      assert.strictEqual(await verifyPin('1234', storedHash), true);
      assert.strictEqual(await verifyPin('1235', storedHash), false);
      assert.strictEqual(await verifyPin('4321', storedHash), false);
      assert.strictEqual(await verifyPin('0000', storedHash), false);
    });

    it('verifyPin handles edge cases: empty strings, null, undefined, falsy values', async () => {
      const validHash = await hashPin('1234');

      // Empty PIN or empty storedHash
      assert.strictEqual(await verifyPin('', validHash), false, 'Empty PIN must return false');
      assert.strictEqual(await verifyPin('1234', ''), false, 'Empty hash must return false');
      assert.strictEqual(await verifyPin('', ''), false, 'Empty PIN and hash must return false');

      // Null and undefined
      assert.strictEqual(await verifyPin(null, validHash), false, 'Null PIN must return false');
      assert.strictEqual(await verifyPin(undefined, validHash), false, 'Undefined PIN must return false');
      assert.strictEqual(await verifyPin('1234', null), false, 'Null hash must return false');
      assert.strictEqual(await verifyPin('1234', undefined), false, 'Undefined hash must return false');

      // Falsy number 0 and boolean false
      assert.strictEqual(await verifyPin(0, validHash), false, '0 PIN must return false due to truthiness guard');
      assert.strictEqual(await verifyPin(false, validHash), false, 'false PIN must return false');
    });

    it('verifyPin handles non-string inputs gracefully', async () => {
      const validHash = await hashPin('1234');

      // Number 1234 gets coerced via String(1234) -> "1234"
      assert.strictEqual(await verifyPin(1234, validHash), true, 'Numeric 1234 coerced to "1234" matches');

      // Numeric mismatch
      assert.strictEqual(await verifyPin(9999, validHash), false, 'Numeric 9999 does not match');

      // Array and Object coercion
      assert.strictEqual(await verifyPin([], validHash), false, 'Array [] coerces to "" and returns false');
      assert.strictEqual(await verifyPin({}, validHash), false, 'Object {} coerces to "[object Object]" and returns false');
    });

    it('verifyPin differentiates 3-digit vs 4-digit vs 5-digit inputs', async () => {
      const hash1234 = await hashPin('1234');

      assert.strictEqual(await verifyPin('123', hash1234), false, '3-digit prefix must not match 4-digit PIN');
      assert.strictEqual(await verifyPin('12345', hash1234), false, '5-digit extension must not match 4-digit PIN');
      assert.strictEqual(await verifyPin(' 1234', hash1234), false, 'Leading whitespace must not match');
      assert.strictEqual(await verifyPin('1234 ', hash1234), false, 'Trailing whitespace must not match');
    });

    it('exhibits collision resistance and avalanche effect across 1,000 distinct PIN combinations', async () => {
      const seenHashes = new Set();
      const sampleSize = 1000;

      for (let i = 0; i < sampleSize; i++) {
        const pin = String(i).padStart(4, '0');
        const hash = await hashPin(pin);

        assert.strictEqual(hash.length, 64);
        assert.ok(!seenHashes.has(hash), `Collision detected at PIN ${pin}!`);
        seenHashes.add(hash);
      }

      assert.strictEqual(seenHashes.size, sampleSize, 'All 1,000 generated PIN hashes must be unique');

      // Avalanche check: 1-character difference changes > 30% of hexadecimal characters
      const h1 = await hashPin('1234');
      const h2 = await hashPin('1235');
      let diffChars = 0;
      for (let i = 0; i < 64; i++) {
        if (h1[i] !== h2[i]) diffChars++;
      }
      assert.ok(diffChars > 30, `Avalanche effect failed: only ${diffChars} differing characters between "1234" and "1235"`);
    });
  });

  describe('2. PinLockScreen Logic & Adversarial State Harness', () => {

    // Pure state harness mirroring PinLockScreen.jsx state transitions
    function createPinLockHarness(options = {}) {
      const {
        storedPinHash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // '1234'
        mode = 'unlock',
        onSuccess = () => {}
      } = options;

      let pin = '';
      let firstPin = '';
      let setupStep = 1;
      let failedAttempts = 0;
      let lockoutSeconds = 0;
      let errorMessage = '';
      let isShaking = false;
      let successCalledWith = null;

      function handleKeyPress(digit) {
        if (lockoutSeconds > 0) return false;
        errorMessage = '';

        // Clamping to 4 digits
        if (pin.length >= 4) {
          return false;
        }
        pin = pin + String(digit);
        return true;
      }

      function handleDelete() {
        if (lockoutSeconds > 0) return false;
        pin = pin.slice(0, -1);
        return true;
      }

      async function triggerProcessPin() {
        if (pin.length !== 4) return;

        if (mode === 'unlock') {
          const isValid = await verifyPin(pin, storedPinHash);
          if (isValid) {
            failedAttempts = 0;
            pin = '';
            successCalledWith = true;
            onSuccess();
          } else {
            isShaking = true;
            const nextAttempts = failedAttempts + 1;
            failedAttempts = nextAttempts;
            pin = '';

            if (nextAttempts >= 3) {
              lockoutSeconds = 30;
              errorMessage = 'Çok sayıda hatalı deneme. 30 saniye bekleyin.';
            } else {
              errorMessage = `Hatalı PIN (${nextAttempts}/3)`;
            }
          }
        } else if (mode === 'setup') {
          if (setupStep === 1) {
            firstPin = pin;
            pin = '';
            setupStep = 2;
          } else if (setupStep === 2) {
            if (pin === firstPin) {
              const newHash = await hashPin(pin);
              pin = '';
              firstPin = '';
              setupStep = 1;
              successCalledWith = newHash;
              onSuccess(newHash);
            } else {
              isShaking = true;
              errorMessage = 'PIN kodları eşleşmedi. Tekrar deneyin.';
              pin = '';
              firstPin = '';
              setupStep = 1;
            }
          }
        }
      }

      function tickSecond() {
        if (lockoutSeconds <= 0) return 0;
        if (lockoutSeconds <= 1) {
          failedAttempts = 0;
          errorMessage = '';
          lockoutSeconds = 0;
          return 0;
        }
        lockoutSeconds -= 1;
        return lockoutSeconds;
      }

      return {
        get pin() { return pin; },
        get firstPin() { return firstPin; },
        get setupStep() { return setupStep; },
        get failedAttempts() { return failedAttempts; },
        get lockoutSeconds() { return lockoutSeconds; },
        get errorMessage() { return errorMessage; },
        get isShaking() { return isShaking; },
        get successCalledWith() { return successCalledWith; },
        handleKeyPress,
        handleDelete,
        triggerProcessPin,
        tickSecond
      };
    }

    it('clamps input strictly to 4 digits and ignores subsequent keypresses', () => {
      const harness = createPinLockHarness();

      assert.strictEqual(harness.handleKeyPress('1'), true);
      assert.strictEqual(harness.handleKeyPress('2'), true);
      assert.strictEqual(harness.handleKeyPress('3'), true);
      assert.strictEqual(harness.handleKeyPress('4'), true);
      assert.strictEqual(harness.pin, '1234');

      // Attempting 5th, 6th, and 7th digits must be rejected and state unchanged
      assert.strictEqual(harness.handleKeyPress('5'), false);
      assert.strictEqual(harness.handleKeyPress('6'), false);
      assert.strictEqual(harness.handleKeyPress('7'), false);
      assert.strictEqual(harness.pin, '1234', 'PIN must remain clamped to 4 digits');
    });

    it('supports deletion and prevents negative string slicing', () => {
      const harness = createPinLockHarness();

      harness.handleKeyPress('1');
      harness.handleKeyPress('2');
      assert.strictEqual(harness.pin, '12');

      harness.handleDelete();
      assert.strictEqual(harness.pin, '1');

      harness.handleDelete();
      assert.strictEqual(harness.pin, '');

      // Extra delete on empty PIN must be safe
      harness.handleDelete();
      assert.strictEqual(harness.pin, '');
    });

    it('triggers 30-second lockout after exactly 3 consecutive failed attempts', async () => {
      let successFired = false;
      const harness = createPinLockHarness({
        storedPinHash: await hashPin('1234'),
        onSuccess: () => { successFired = true; }
      });

      // Failed Attempt 1
      harness.handleKeyPress('0');
      harness.handleKeyPress('0');
      harness.handleKeyPress('0');
      harness.handleKeyPress('0');
      await harness.triggerProcessPin();

      assert.strictEqual(harness.failedAttempts, 1);
      assert.strictEqual(harness.lockoutSeconds, 0);
      assert.strictEqual(harness.errorMessage, 'Hatalı PIN (1/3)');
      assert.strictEqual(successFired, false);

      // Failed Attempt 2
      harness.handleKeyPress('9');
      harness.handleKeyPress('9');
      harness.handleKeyPress('9');
      harness.handleKeyPress('9');
      await harness.triggerProcessPin();

      assert.strictEqual(harness.failedAttempts, 2);
      assert.strictEqual(harness.lockoutSeconds, 0);
      assert.strictEqual(harness.errorMessage, 'Hatalı PIN (2/3)');
      assert.strictEqual(successFired, false);

      // Failed Attempt 3 -> LOCKOUT TRIGGERED!
      harness.handleKeyPress('8');
      harness.handleKeyPress('8');
      harness.handleKeyPress('8');
      harness.handleKeyPress('8');
      await harness.triggerProcessPin();

      assert.strictEqual(harness.failedAttempts, 3);
      assert.strictEqual(harness.lockoutSeconds, 30, 'Lockout must be set to exactly 30 seconds');
      assert.strictEqual(harness.errorMessage, 'Çok sayıda hatalı deneme. 30 saniye bekleyin.');
      assert.strictEqual(successFired, false);

      // While locked out, all keypress and delete attempts must be blocked
      const pressResult = harness.handleKeyPress('1');
      assert.strictEqual(pressResult, false, 'Keypress must be rejected during lockout');
      assert.strictEqual(harness.pin, '', 'PIN must remain empty while locked out');

      const deleteResult = harness.handleDelete();
      assert.strictEqual(deleteResult, false, 'Delete must be rejected during lockout');
    });

    it('countdown timer decrements per second and resets lockout at 0', async () => {
      const harness = createPinLockHarness({
        storedPinHash: await hashPin('1234')
      });

      // Cause 3 failures to trigger lockout
      for (let i = 0; i < 3; i++) {
        harness.handleKeyPress('1');
        harness.handleKeyPress('1');
        harness.handleKeyPress('1');
        harness.handleKeyPress('1');
        await harness.triggerProcessPin();
      }

      assert.strictEqual(harness.lockoutSeconds, 30);
      assert.strictEqual(harness.failedAttempts, 3);

      // Simulate 29 seconds elapsed
      for (let s = 1; s <= 29; s++) {
        const remaining = harness.tickSecond();
        assert.strictEqual(remaining, 30 - s);
        assert.strictEqual(harness.lockoutSeconds, 30 - s);
      }
      assert.strictEqual(harness.lockoutSeconds, 1);

      // Final 30th second tick -> unlocks!
      const finalRemaining = harness.tickSecond();
      assert.strictEqual(finalRemaining, 0);
      assert.strictEqual(harness.lockoutSeconds, 0);
      assert.strictEqual(harness.failedAttempts, 0, 'failedAttempts must reset to 0 after countdown completes');
      assert.strictEqual(harness.errorMessage, '', 'errorMessage must clear after countdown completes');

      // Now keypad accepts input again
      assert.strictEqual(harness.handleKeyPress('1'), true);
      assert.strictEqual(harness.pin, '1');
    });

    it('successful PIN entry immediately clears failedAttempts and calls onSuccess', async () => {
      let successFired = false;
      const harness = createPinLockHarness({
        storedPinHash: await hashPin('1234'),
        onSuccess: () => { successFired = true; }
      });

      // 1 failed attempt
      harness.handleKeyPress('9');
      harness.handleKeyPress('9');
      harness.handleKeyPress('9');
      harness.handleKeyPress('9');
      await harness.triggerProcessPin();
      assert.strictEqual(harness.failedAttempts, 1);

      // Now enter correct PIN '1234'
      harness.handleKeyPress('1');
      harness.handleKeyPress('2');
      harness.handleKeyPress('3');
      harness.handleKeyPress('4');
      await harness.triggerProcessPin();

      assert.strictEqual(harness.failedAttempts, 0, 'Successful PIN entry must clear failedAttempts to 0');
      assert.strictEqual(harness.pin, '', 'PIN must be cleared after verification');
      assert.strictEqual(successFired, true);
    });

    it('verifies two-step PIN setup mode: matching confirmation hashes and saves new PIN', async () => {
      let generatedHash = null;
      const harness = createPinLockHarness({
        mode: 'setup',
        onSuccess: (hash) => { generatedHash = hash; }
      });

      assert.strictEqual(harness.setupStep, 1);

      // Step 1: Enter new PIN '5678'
      harness.handleKeyPress('5');
      harness.handleKeyPress('6');
      harness.handleKeyPress('7');
      harness.handleKeyPress('8');
      await harness.triggerProcessPin();

      assert.strictEqual(harness.setupStep, 2, 'Setup must advance to confirmation step 2');
      assert.strictEqual(harness.firstPin, '5678');
      assert.strictEqual(harness.pin, '');

      // Step 2: Confirm same PIN '5678'
      harness.handleKeyPress('5');
      harness.handleKeyPress('6');
      harness.handleKeyPress('7');
      harness.handleKeyPress('8');
      await harness.triggerProcessPin();

      assert.strictEqual(harness.setupStep, 1, 'Setup must reset to step 1 after success');
      assert.strictEqual(harness.firstPin, '');
      const expectedHash = await hashPin('5678');
      assert.strictEqual(generatedHash, expectedHash, 'New hash must match SHA-256 of confirmed PIN');
    });

    it('verifies two-step PIN setup mode: mismatched confirmation resets to step 1 with error', async () => {
      let generatedHash = null;
      const harness = createPinLockHarness({
        mode: 'setup',
        onSuccess: (hash) => { generatedHash = hash; }
      });

      // Step 1: Enter '5678'
      harness.handleKeyPress('5');
      harness.handleKeyPress('6');
      harness.handleKeyPress('7');
      harness.handleKeyPress('8');
      await harness.triggerProcessPin();
      assert.strictEqual(harness.setupStep, 2);

      // Step 2: Enter mismatched '5679'
      harness.handleKeyPress('5');
      harness.handleKeyPress('6');
      harness.handleKeyPress('7');
      harness.handleKeyPress('9');
      await harness.triggerProcessPin();

      assert.strictEqual(harness.setupStep, 1, 'Mismatched PIN must reset back to step 1');
      assert.strictEqual(harness.firstPin, '', 'Mismatched PIN must discard firstPin');
      assert.strictEqual(harness.errorMessage, 'PIN kodları eşleşmedi. Tekrar deneyin.');
      assert.strictEqual(generatedHash, null);
    });
  });

  describe('3. Component Source Integrity & AST Conformance', () => {

    it('validates PinLockScreen.jsx source code rules and safety guards', () => {
      const componentPath = path.resolve('src/components/PinLockScreen.jsx');
      const source = fs.readFileSync(componentPath, 'utf-8');

      // Clamping rule
      assert.match(source, /prev\.length\s*>=\s*4/, 'Must check prev.length >= 4 in handleKeyPress');

      // Lockout rule
      assert.match(source, /if\s*\(\s*lockoutSeconds\s*>\s*0\s*\)\s*return/, 'Must guard handleKeyPress with lockoutSeconds check');
      assert.match(source, /nextAttempts\s*>=\s*3/, 'Must trigger lockout on 3 or more failed attempts');
      assert.match(source, /setLockoutSeconds\s*\(\s*30\s*\)/, 'Must set 30s lockout countdown');

      // Countdown interval rule
      assert.match(source, /setInterval\s*\(.*1000\s*\)/s, 'Must decrement lockout countdown with 1000ms interval');
      assert.match(source, /setFailedAttempts\s*\(\s*0\s*\)/, 'Must reset failedAttempts when lockout expires');

      // Apple minimalist aesthetics & accessibility
      assert.match(source, /@keyframes pinShake/, 'Must include shake keyframe animation for tactile error response');
      assert.match(source, /aria-label="Sil"/, 'Delete key must include accessible aria-label');
      assert.match(source, /spring-click/, 'Keypad buttons must utilize spring-click class');
    });

    it('validates crypto.js implementation integrity', () => {
      const cryptoPath = path.resolve('src/utils/crypto.js');
      const source = fs.readFileSync(cryptoPath, 'utf-8');

      assert.match(source, /digest\s*\(\s*['"]SHA-256['"]/, 'Must use native SHA-256 subtle digest');
      assert.match(source, /padStart\s*\(\s*2\s*,\s*['"]0['"]\s*\)/, 'Must zero-pad byte hex representation');
      assert.match(source, /if\s*\(\s*!pin\s*\|\|\s*!storedHash\s*\)\s*return\s*false/, 'Must guard empty pin or hash');
    });
  });
});
