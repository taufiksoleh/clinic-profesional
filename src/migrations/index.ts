import * as migration_20261003_181247_initial from './20261003_181247_initial';
import * as migration_20261003_181703_page_seo_and_links from './20261003_181703_page_seo_and_links';
import * as migration_20261004_073427_notification_delivery from './20261004_073427_notification_delivery';

export const migrations = [
  {
    up: migration_20261003_181247_initial.up,
    down: migration_20261003_181247_initial.down,
    name: '20261003_181247_initial',
  },
  {
    up: migration_20261003_181703_page_seo_and_links.up,
    down: migration_20261003_181703_page_seo_and_links.down,
    name: '20261003_181703_page_seo_and_links',
  },
  {
    up: migration_20261004_073427_notification_delivery.up,
    down: migration_20261004_073427_notification_delivery.down,
    name: '20261004_073427_notification_delivery'
  },
];
