import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { WikiService } from '../wiki/wiki.service';
import { WIKI_SPECIES } from '../wiki/wiki-species.data';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const wikiService = app.get(WikiService);

  const items = WIKI_SPECIES.map((entry) => ({
    name: entry.properties.chineseName || entry.title,
    englishName: entry.properties.englishName,
    slug: entry.slug,
    category: 'wood-species',
    description: entry.summary,
    photos: [entry.heroImage],
    suitableScenes: entry.suitableScenes,
    priceRange: entry.properties.referencePrice,
    properties: entry,
  }));

  const result = await wikiService.seedFromArray(items);

  console.log('Seed wiki_species result:', result);

  await app.close();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
