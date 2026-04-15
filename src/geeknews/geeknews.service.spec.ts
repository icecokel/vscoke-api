import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GeekNewsService } from './geeknews.service';
import { GeekNewsArticle } from './entities/geeknews-article.entity';
import { GeekNewsCrawlerService } from './geeknews.crawler.service';
import { GeekNewsTranslationService } from './geeknews.translation.service';
import { GeekNewsTopicDetail, GeekNewsTopicSummary } from './geeknews.types';

const mockGeekNewsArticleRepository = () => ({
  find: jest.fn(),
  create: jest.fn((entity: Partial<GeekNewsArticle>) => entity),
  save: jest.fn(),
});

describe('GeekNewsService', () => {
  let service: GeekNewsService;
  let repository: ReturnType<typeof mockGeekNewsArticleRepository>;
  let crawlerService: {
    crawlLatestPage: jest.Mock<Promise<GeekNewsTopicSummary[]>, [number]>;
    crawlTopicDetail: jest.Mock<
      Promise<GeekNewsTopicDetail>,
      [GeekNewsTopicSummary]
    >;
  };
  let translationService: {
    getTargetLanguage: jest.Mock<string, []>;
    translateContent: jest.Mock;
  };

  beforeEach(async () => {
    crawlerService = {
      crawlLatestPage: jest.fn<Promise<GeekNewsTopicSummary[]>, [number]>(),
      crawlTopicDetail: jest.fn<
        Promise<GeekNewsTopicDetail>,
        [GeekNewsTopicSummary]
      >(),
    };
    translationService = {
      getTargetLanguage: jest.fn<string, []>().mockReturnValue('en'),
      translateContent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeekNewsService,
        {
          provide: getRepositoryToken(GeekNewsArticle),
          useFactory: mockGeekNewsArticleRepository,
        },
        {
          provide: GeekNewsCrawlerService,
          useValue: crawlerService,
        },
        {
          provide: GeekNewsTranslationService,
          useValue: translationService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string | number) =>
              key === 'GEEKNEWS_CRAWL_PAGE_LIMIT' ? 2 : defaultValue,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<GeekNewsService>(GeekNewsService);
    repository = module.get(getRepositoryToken(GeekNewsArticle));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('새 긱뉴스 토픽을 번역하고 저장해야 함', async () => {
    const topic = createTopicSummary();
    const detail = createTopicDetail(topic);
    const savedAt = new Date('2026-04-14T00:00:00.000Z');

    crawlerService.crawlLatestPage
      .mockResolvedValueOnce([topic])
      .mockResolvedValueOnce([]);
    crawlerService.crawlTopicDetail.mockResolvedValue(detail);
    repository.find.mockResolvedValue([]);
    translationService.translateContent.mockResolvedValue({
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      targetLanguage: 'en',
      translatedTitle: 'Translated Title',
      translatedContent: 'Translated Content',
    });
    repository.save.mockImplementation(
      async (entity: Partial<GeekNewsArticle>) =>
        ({
          id: 'article-1',
          createdAt: savedAt,
          updatedAt: savedAt,
          ...entity,
        }) as GeekNewsArticle,
    );

    const result = await service.syncLatestTopics();

    expect(crawlerService.crawlLatestPage).toHaveBeenCalledWith(1);
    expect(crawlerService.crawlTopicDetail).toHaveBeenCalledWith(topic);
    expect(translationService.translateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: detail.title,
        content: detail.content,
        targetLanguage: 'en',
      }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceTopicId: topic.topicId,
        translatedTitle: 'Translated Title',
        translationStatus: 'translated',
      }),
    );
    expect(result.status).toBe('completed');
    expect(result.createdTopics).toBe(1);
    expect(result.translatedTopics).toBe(1);
    expect(result.failedTopics).toBe(0);
    expect(result.articles[0]?.translatedTitle).toBe('Translated Title');
  });

  it('기존 토픽은 메타데이터만 갱신하고 상세 수집은 건너뛰어야 함', async () => {
    const topic = createTopicSummary();
    const existingArticle = {
      id: 'article-1',
      sourceTopicId: topic.topicId,
      topicUrl: topic.topicUrl,
      sourceUrl: topic.sourceUrl,
      title: '기존 제목',
      content: '기존 본문',
      author: 'winterjung',
      points: 1,
      commentCount: 0,
      rank: 10,
      listedAtText: '1일전',
      postedAt: new Date('2026-04-13T00:00:00.000Z'),
      sourceLanguage: 'ko',
      translatedLanguage: 'en',
      translatedTitle: 'Existing Title',
      translatedContent: 'Existing Content',
      translationStatus: 'translated',
      translationProvider: 'gemini',
      translationModel: 'gemini-2.5-flash',
      translationError: null,
      translatedAt: new Date('2026-04-13T00:00:00.000Z'),
      createdAt: new Date('2026-04-13T00:00:00.000Z'),
      updatedAt: new Date('2026-04-13T00:00:00.000Z'),
    } as GeekNewsArticle;

    crawlerService.crawlLatestPage.mockResolvedValueOnce([topic]);
    repository.find.mockResolvedValueOnce([existingArticle]);
    repository.save.mockImplementation(
      async (entity: GeekNewsArticle) => entity,
    );

    const result = await service.syncLatestTopics();

    expect(crawlerService.crawlTopicDetail).not.toHaveBeenCalled();
    expect(translationService.translateContent).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'article-1',
        points: topic.points,
        commentCount: topic.commentCount,
        rank: topic.rank,
      }),
    );
    expect(result.createdTopics).toBe(0);
    expect(result.updatedTopics).toBe(1);
    expect(result.skippedTopics).toBe(1);
  });
});

function createTopicSummary(): GeekNewsTopicSummary {
  return {
    topicId: 28511,
    topicUrl: 'https://news.hada.io/topic?id=28511',
    sourceUrl: 'https://example.com/article',
    title: '원문 제목',
    summary: '요약 본문',
    author: 'winterjung',
    points: 13,
    commentCount: 10,
    rank: 1,
    listedAtText: '2시간전',
  };
}

function createTopicDetail(topic: GeekNewsTopicSummary): GeekNewsTopicDetail {
  return {
    ...topic,
    content: '상세 본문',
    postedAt: new Date('2026-04-14T02:11:43.000Z'),
  };
}
