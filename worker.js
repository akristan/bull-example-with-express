const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t * 1000));

module.exports = async (job) => {
  await job.log('Job Metadata: ' + JSON.stringify(job));
  for (let i = 0; i <= 10; i++) {
    if (job.data[i]) continue;

    const sleepMs = +Number(Math.random()).toFixed(2);
    await job.log(`~~ Sleep ${sleepMs}s`);
    await sleep(sleepMs);

    if (job.id % 5 === 0 && i === 9) {
      return Promise.reject(new Error(`Random error triggered at step 9!`));
    }
    // update data at each step to mark it 'done'
    // useful when u have a job with multiple steps
    // and u dont want to retry it
    await job.update({ ...job.data, [i]: 'done' });
    await job.log(`[Step ${i}] Done`);
  }
  await job.progress(100);

  return Promise.resolve({ message: 'Success job done!' });
};
