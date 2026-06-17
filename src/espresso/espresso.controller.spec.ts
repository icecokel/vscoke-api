import { Test, TestingModule } from '@nestjs/testing';
import { EspressoController } from './espresso.controller';
import { EspressoService } from './espresso.service';
import { CreateEspressoRawEntryDto } from './dto/create-espresso-raw-entry.dto';

const mockEspressoService = () => ({
  getNormalizedData: jest.fn(),
  getRawData: jest.fn(),
  createRawEntry: jest.fn(),
});

describe('EspressoController', () => {
  let controller: EspressoController;
  let service: ReturnType<typeof mockEspressoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EspressoController],
      providers: [
        {
          provide: EspressoService,
          useFactory: mockEspressoService,
        },
      ],
    }).compile();

    controller = module.get<EspressoController>(EspressoController);
    service = module.get(EspressoService);
  });

  it('정규화 에스프레소 데이터를 반환해야 함', async () => {
    const data = { schemaVersion: 1, beans: [] };
    service.getNormalizedData.mockResolvedValue(data);

    const result = await controller.getNormalizedData();

    expect(service.getNormalizedData).toHaveBeenCalled();
    expect(result).toEqual(data);
  });

  it('raw 에스프레소 데이터를 반환해야 함', async () => {
    const data = { schemaVersion: 1, entries: [] };
    service.getRawData.mockResolvedValue(data);

    const result = await controller.getRawData();

    expect(service.getRawData).toHaveBeenCalled();
    expect(result).toEqual(data);
  });

  it('raw entry를 생성해야 함', async () => {
    const dto: CreateEspressoRawEntryDto = {
      id: 'raw-new-entry',
      beanName: '원두 에스쇼콜라',
      source: 'manual',
      capturedAt: '2026-06-17',
      text: '추출 기록',
    };
    service.createRawEntry.mockResolvedValue(dto);

    const result = await controller.createRawEntry(dto);

    expect(service.createRawEntry).toHaveBeenCalledWith(dto);
    expect(result).toEqual(dto);
  });
});
