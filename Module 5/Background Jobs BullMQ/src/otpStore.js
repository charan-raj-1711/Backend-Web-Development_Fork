'use strict';

// ─── YOUR FILE, implement this ───────────────────────────────────────────────
// In-memory OTP store for email verification.
//
// Implement and export:
//
//  generateOTP()
//    Returns a random 6-digit numeric string (e.g. '183726').
//
//  storeOTP(email, otp)
//    Saves the OTP in a Map with:
//      - expiresAt: Date.now() + 10 minutes
//      - attempts: 0
//
//  verifyOTP(email, code)
//    Returns { ok, reason }. Check guards IN ORDER:
//      1. Not found   → { ok: false, reason: 'not_found'          }  → 401
//      2. Expired     → { ok: false, reason: 'expired'            }  → 410  (also delete entry)
//      3. Attempts≥3  → { ok: false, reason: 'too_many_attempts'  }  → 429
//      4. Wrong code  → { ok: false, reason: 'wrong_code'         }  → 401  (increment attempts)
//      5. Correct     → delete entry (single-use), return { ok: true }
//
//  markVerified(email)
//    Log that email is verified. In production: update the DB.
//
//  IMPORTANT, also export the Map itself as `_store`:
//    module.exports = { generateOTP, storeOTP, verifyOTP, markVerified, _store };
//    The test suite (Test 6) reaches into `_store` directly to simulate an
//    already-expired OTP, since there's no other way to fast-forward time.
//    Without this export, Test 6 fails even with a correct verifyOTP().

// TODO: implement

const store = new Map();

function generateOTP() {
  // throw new Error('not implemented');
  return String(Math.floor(100000 + Math.random() * 900000));
}

function storeOTP(email, otp) {
  // throw new Error('not implemented');
  store.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });
}

function verifyOTP(email, code) {
  // throw new Error('not implemented');
  const record = store.get(email);

  // 1. Check whether an OTP exists.
  if(!record) {
    return { ok: false, reason: 'not_found'};
  }

  // 2. Check whether the OTP has expired.
  if (Date.now() > record.expiresAt) {
    return { ok: false, reason: 'expired'};
  }

  // 3. Check whether the maximum attempts have been reached.
  if(record.attempts >= 3) {
    return { ok: false, reason: 'too_many_attempts'};
  }

  // 4. Check whether the submitted code is incorrect.
  if(record.otp !== code) {
    record.attempts += 1;
    return { ok: false, reason: ' wrong_code'};
  }

  // 5. Correct OTP: delete it so it cannot be reused.
  store.delete(email);

  return {ok: true };
}

function markVerified(email) {
  // throw new Error('not implemented');
  console.log(`Your email ${email} is verified.`);
}

module.exports = { generateOTP, storeOTP, verifyOTP, markVerified, _store: store };
