import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { EspressoBean } from './entities/espresso-bean.entity';
import { EspressoRawEntry } from './entities/espresso-raw-entry.entity';
import { EspressoService } from './espresso.service';
import { CreateEspressoRawEntryDto } from './dto/create-espresso-raw-entry.dto';

const mockRepository = () => ({
  create: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
});

describe('EspressoService', () => {
  let service: EspressoService;
  let beanRepository: ReturnType<typeof mockRepository>;
  let rawEntryRepository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EspressoService,
        {
          provide: getRepositoryToken(EspressoBean),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(EspressoRawEntry),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EspressoService>(EspressoService);
    beanRepository = module.get(getRepositoryToken(EspressoBean));
    rawEntryRepository = module.get(getRepositoryToken(EspressoRawEntry));
  });

  it('정규화 원두 payload를 schemaVersion과 함께 반환해야 함', async () => {
    const payload = {
      id: 'bean-momos-es-chocolat',
      name: '원두 에스쇼콜라',
      goals: ['다크초콜릿'],
      defaultEquipment: {
        machine: 'CRM 3605 PWM 2버전',
        basket: 'IMS 20g',
        tamper: '정압 템퍼',
      },
      logs: [],
    };
    beanRepository.find.mockResolvedValue([{ payload }]);

    const result = await service.getNormalizedData();

    expect(beanRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'ASC' },
    });
    expect(result).toEqual({
      schemaVersion: 1,
      beans: [payload],
    });
  });

  it('raw entry를 schemaVersion과 함께 반환해야 함', async () => {
    const entry = {
      id: 'raw-momos-es-chocolat-round-001',
      beanName: '원두 에스쇼콜라',
      source: 'manual',
      capturedAt: '2026-06-17',
      text: '모모스 커피 에스쇼콜라 1라운드 기록',
      normalizedBeanId: 'bean-momos-es-chocolat',
      normalizedLogId: 'log-momos-es-chocolat-espresso-001',
      normalizedRoundId: 'round-001',
    };
    rawEntryRepository.find.mockResolvedValue([entry]);

    const result = await service.getRawData();

    expect(rawEntryRepository.find).toHaveBeenCalledWith({
      order: { capturedAt: 'ASC', createdAt: 'ASC' },
    });
    expect(result).toEqual({
      schemaVersion: 1,
      entries: [entry],
    });
  });

  it('새 raw entry를 저장해야 함', async () => {
    const dto: CreateEspressoRawEntryDto = {
      id: 'raw-new-entry',
      beanName: '원두 에스쇼콜라',
      source: 'manual',
      capturedAt: '2026-06-17',
      text: '추출 기록',
      normalizedBeanId: 'bean-momos-es-chocolat',
    };
    const entity = { ...dto };
    rawEntryRepository.create.mockReturnValue(entity);
    rawEntryRepository.save.mockResolvedValue(entity);

    const result = await service.createRawEntry(dto);

    expect(rawEntryRepository.create).toHaveBeenCalledWith(dto);
    expect(rawEntryRepository.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(entity);
  });
});
