import { main } from '../src/crawlers/fauxy-crawler';

main().catch((error) => {
  console.error('Error running crawler:', error);
  process.exit(1);
}); 