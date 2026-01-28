import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameHistory } from './entities/game-history.entity';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { GameType } from './enums/game-type.enum';

const mockGameHistoryRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('GameService', () => {
  let service: GameService;
  let repository: MockRepository<GameHistory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: getRepositoryToken(GameHistory),
          useFactory: mockGameHistoryRepository,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    repository = module.get<MockRepository<GameHistory>>(
      getRepositoryToken(GameHistory),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createHistory', () => {
    it('should create and save a game history with gameType', async () => {
      const user = new User();
      user.id = 'test-id';
      const createDto: CreateGameHistoryDto = {
        score: 100,
        gameType: GameType.BLOCK_TOWER,
      };
      const savedHistory = { id: 1, ...createDto, user };

      repository.create.mockReturnValue(savedHistory);
      repository.save.mockResolvedValue(savedHistory);

      const result = await service.createHistory(user, createDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        user,
      });
      expect(repository.save).toHaveBeenCalledWith(savedHistory);
      expect(result).toEqual(savedHistory);
    });
  });

  describe('getRanking', () => {
    it('should return top 10 game histories without filtering', async () => {
      const mockRankings = Array(10).fill({
        score: 100,
        gameType: GameType.BLOCK_TOWER,
      });
      repository.find.mockResolvedValue(mockRankings);

      const result = await service.getRanking();

      expect(repository.find).toHaveBeenCalledWith({
        order: { score: 'DESC' },
        where: { gameType: undefined }, // Should allow undefined to fetch all or implementation detail
        take: 10,
        relations: ['user'],
      });
      expect(result).toEqual(mockRankings);
    });

    it('should filter ranking by gameType', async () => {
      const mockRankings = [{ score: 200, gameType: GameType.SKY_DROP }];
      repository.find.mockResolvedValue(mockRankings);

      const result = await service.getRanking(GameType.SKY_DROP);

      expect(repository.find).toHaveBeenCalledWith({
        order: { score: 'DESC' },
        where: { gameType: GameType.SKY_DROP },
        take: 10,
        relations: ['user'],
      });
      expect(result).toEqual(mockRankings);
    });
  });
});
