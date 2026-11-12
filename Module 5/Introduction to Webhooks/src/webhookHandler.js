'use strict';

// ─── YOUR FILE — implement this ───────────────────────────────────────────────
// Export handleWebhook(req, res), used by POST /webhooks in app.js.
// Also export _processedIds (your Set or Map) for test inspection/reset.
//
// Steps (in order):
//  1. Verify HMAC-SHA256 signature
//     - Signature header: req.headers['x-webhook-signature'] → 'sha256=<hex>'
//     - Compute: crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body).digest('hex')
//     - Compare: crypto.timingSafeEqual(Buffer.from(expected,'hex'), Buffer.from(received,'hex'))
//     - Mismatch or missing → res.status(401).json({ error: 'Invalid signature' })
//
//  2. Parse body: const event = JSON.parse(req.body)
//
//  3. Idempotency: if _processedIds.has(event.id) → res.status(200).json({ status: 'already_processed' })
//
//  4. Mark: _processedIds.add(event.id)
//
//  5. Acknowledge: res.status(200).json({ status: 'received' })
//     Then call handleEvent(event) inside setImmediate(() => { ... })

const { handleEvent } = require('./eventHandlers');

// TODO: implement

const crypto = require('crypto');

const _processedIds = new Set();

async function handleWebhook(req, res) {
  // 1. Get the signature and secret
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  // Reject missing signature or secret
  if(!signature || !secret || !Buffer.isBuffer(req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Calculate HMAC-SHA256 using the original request Buffer
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  // Remove the sha256= prefix
  const receivedHex = signature.startsWith('sha256=')
  ? signature.slice(7)
  : '';

  // Convert signatures into Buffers
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const receivedBuffer = Buffer.from(receivedHex, 'hex');

  // Check lengths before timingSafeEqual to prevent errors
  if(
    receivedBuffer.length !== expectedBuffer.length ||
    !/^[a-fA-F0-9]{64}$/.test(receivedHex) ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return res.status(401).json({ erro: 'Invalid signature' });
  }

  // 3. Parse the body only after signature verification
  let event;

  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch(error) {
    return res.status(400).json({ error: 'Invalid JSON body'});
  }

  // 4. Check whether this event was already processed
  if(_processedIds.has(event.id)) {
    return res.status(200).json({ status: 'already_processed'});
  }

  // 5. Mark the event before processing it
  _processedIds.add(event.id);

  // 6. Acknowledge the webhook immediately
  res.status(200).json({ status: 'received'});

  // 7. Process the event after sending the response
  setImmediate(() => {
    try {
      Promise.resolve(handleEvent(event)).catch((error => {
        console.error('Webhook processing failed:', error);
      }));
    } catch(error) {
      console.error('Webhook processing failed:', error);
    }
  });
  // res.status(501).json({ error: 'not implemented' });
}

module.exports = { handleWebhook, _processedIds };
