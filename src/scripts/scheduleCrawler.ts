import { CronJob } from 'cron';
import { updateArticles } from './fetchFauxyArticles';

// Run crawler every 6 hours
const job = new CronJob('0 */6 * * *', async () => {
  console.log('Starting scheduled crawl:', new Date().toISOString());
  await updateArticles();
  console.log('Finished scheduled crawl:', new Date().toISOString());
});

job.start();
console.log('Crawler scheduler started'); 