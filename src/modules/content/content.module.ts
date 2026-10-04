import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { hasOpenAiPath } from '../../common/openai-chat-completion';
import { OpenAiContentAiProvider } from './ai/openai-content-ai.provider';
import { CONTENT_AI_PROVIDER } from './ai/content-ai.provider.token';
import { StubContentAiProvider } from './ai/stub-content-ai.provider';
import { ContentAiService } from './content-ai.service';
import { ContentController } from './content.controller';
import { EditorAiService } from './editor-ai.service';
import { ContentItem } from './content.entity';
import { ContentService } from './content.service';

const contentAiLogger = new Logger('ContentModule');

@Module({
  imports: [TypeOrmModule.forFeature([ContentItem])],
  controllers: [ContentController],
  providers: [
    ContentService,
    ContentAiService,
    EditorAiService,
    {
      provide: CONTENT_AI_PROVIDER,
      useFactory: (config: ConfigService) => {
        const driver = (
          config.get<string>('CONTENT_AI_DRIVER') || 'stub'
        ).toLowerCase();
        if (driver === 'openai' && hasOpenAiPath(config)) {
          return new OpenAiContentAiProvider(config);
        }
        if (driver === 'openai' && !hasOpenAiPath(config)) {
          contentAiLogger.warn(
            'CONTENT_AI_DRIVER=openai but neither MUPI_AI_LLM_URL nor OPENAI_API_KEY is set; using stub provider',
          );
        }
        return new StubContentAiProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [ContentService],
})
export class ContentModule {}
