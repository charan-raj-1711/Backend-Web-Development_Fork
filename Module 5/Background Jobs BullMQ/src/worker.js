'use strict';

// ─── YOUR FILE, implement this ───────────────────────────────────────────────
// Create a BullMQ Worker that processes jobs from the 'email' queue.
//
// Requirements:
//  1. Handle job.name === 'otp': send an email with the OTP using transporter.
//  2. Configure retries: attempts: 3, backoff: { type: 'exponential', delay: 1000 }
//  3. Log worker.on('completed') and worker.on('failed') events.
//  4. Throwing inside the worker function → job fails → BullMQ retries.
//     Returning without throwing → job completed.

// TODO: implement
const { Worker } = require('bullmq');
const { connection } = require('./queue');
const { transporter } = require('./email');

const worker = new Worker(
    'email',
    async (job) => {
        if(job.name === 'otp') {
            const { email, otp } = job.data;

            await transporter.sendMail({
                to: email,
                subject: 'Email Verification OTP',
                text: `Your verification OTP is ${otp}. It is valid for 10 minutes.1`,
            });
        }
    },
    {
        connection,
    }
);

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});

module.exports = worker;
