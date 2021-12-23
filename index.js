const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const Queue = require('bull');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

async function setupBullQueue(queueName, concurrency = 10) {
  const bullQueue = new Queue(queueName, {
    redis: { port: 6380, host: '0.0.0.0' },
    prefix: 'SideEffectAdminBull',
  });

  bullQueue.process(queueName, concurrency, path.join(__dirname, 'worker.js'));
  bullQueue.on('completed', (job, returnvalue) => {
    const jobMetadata = `(id=${job.id} name=${job.name} data=${JSON.stringify(job.data)})`;
    console.log(`[COMPLETE] Job return ${JSON.stringify(returnvalue)} ${jobMetadata}`);
  });
  bullQueue.on('failed', (job, failedReason) => {
    const jobMetadata = `id=${job.id} name=${job.name} data=${JSON.stringify(job.data)}`;
    console.log(`[FAIL] Job failed due to ${failedReason} ${jobMetadata}`);
  });

  return bullQueue;
}

const run = async () => {
  const stopBillUserMq = await setupBullQueue('StopBillUserMQ');
  const sendEmailMq = await setupBullQueue('SendEmailMQ');

  const app = express();
  app.use(bodyParser());

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/ui');

  createBullBoard({
    queues: [new BullMQAdapter(stopBillUserMq), new BullMQAdapter(sendEmailMq)],
    serverAdapter,
  });

  app.use('/ui', serverAdapter.getRouter());

  const handleAddQueue = (queue) => (req, res) => {
    console.log('[add queue]', queue.name, ', payload:', req.body);
    queue.add(queue.name, req.body, {
      attempts: 3,
      backoff: 5000,
    });
    res.json({ ok: true });
  };

  app.use('/sendEmail', handleAddQueue(sendEmailMq));
  app.use('/stopBillUser', handleAddQueue(stopBillUserMq));

  app.listen(3000, () => {
    console.log('Running on 3000...');
    console.log('For the UI, open http://localhost:3000/ui');
    console.log('Make sure Redis is running on port 6380 by default');
    console.log('To create job for billUser, run:');
    console.log(
      `  for i in {1..100}; curl -X POST http://localhost:3000/stopBillUser -H "Content-Type: application/json" -d '{"policyId":1}'`
    );
    console.log('To create job for sendEmail, run:');
    console.log(
      `  for i in {1..100}; curl -X POST http://localhost:3000/sendEmail -H "Content-Type: application/json" -d '{"policyId":1}'`
    );
  });
};

// eslint-disable-next-line no-console
run().catch((e) => console.error(e));
