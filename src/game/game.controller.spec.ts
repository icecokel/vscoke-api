import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { GoogleAuthGuard } from '../auth/google-auth.guard';
import {
  ExecutionContext,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GameHistoryResponseDto } from './dto/game-history-response.dto';
import { GameType } from './enums/game-type.enum';

const mockGameService = () => ({
  createHistory: jest.fn(),
  getRanking: jest.fn(),
});

describe('GameController', () => {
  let controller: GameController;
  let service: ReturnType<typeof mockGameService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        {
          provide: GameService,
          useFactory: mockGameService,
        },
      ],
    })
      .overrideGuard(GoogleAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'test-user' };
          return true;
        },
      })
      .compile();

    controller = module.get<GameController>(GameController);
    service = module.get(GameService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createResult', () => {
    it('should create a game result', async () => {
      const dto: CreateGameHistoryDto = {
        score: 100,
        gameType: GameType.BLOCK_TOWER,
      };
      const req = {
        user: { id: 'test-user', firstName: 'Gil', lastName: 'Dong' },
      };
      const createdHistory = {
        id: '1',
        ...dto,
        user: req.user,
        createdAt: new Date(),
      };

      const expectedResult = {
        id: createdHistory.id,
        score: createdHistory.score,
        gameType: createdHistory.gameType,
        createdAt: createdHistory.createdAt,
        user: {
          displayName: 'Gil Dong',
        },
      };

      service.createHistory.mockResolvedValue(createdHistory as any);

      const result = await controller.createResult(req, dto);

      expect(service.createHistory).toHaveBeenCalledWith(req.user, dto);
      expect(result).toEqual(expectedResult);
    });

    it('should create a game result with playTime', async () => {
      const dto: CreateGameHistoryDto = {
        score: 200,
        gameType: GameType.SKY_DROP,
        playTime: 120,
      };
      const req = {
        user: { id: 'test-user', firstName: 'Gil', lastName: 'Dong' },
      };
      const createdHistory = {
        id: '2',
        ...dto,
        user: req.user,
        createdAt: new Date(),
      };

      const expectedResult: GameHistoryResponseDto = {
        id: createdHistory.id,
        score: createdHistory.score,
        gameType: createdHistory.gameType,
        createdAt: createdHistory.createdAt,
        user: {
          displayName: 'Gil Dong',
        },
      };

      service.createHistory.mockResolvedValue(createdHistory as any);

      const result = await controller.createResult(req, dto);

      expect(service.createHistory).toHaveBeenCalledWith(req.user, dto);
      expect(result).toEqual(expectedResult);
    });

    // Failure Case 1: Service throws an error (e.g., DB error)
    it('should throw InternalServerErrorException if service fails', async () => {
      const dto: CreateGameHistoryDto = {
        score: 100,
        gameType: GameType.BLOCK_TOWER,
      };
      const req = {
        user: { id: 'test-user', firstName: 'Gil', lastName: 'Dong' },
      };

      service.createHistory.mockRejectedValue(new Error('DB Error'));

      await expect(controller.createResult(req, dto)).rejects.toThrow(
        'DB Error',
      );
    });

    // Failure Case 2: DTO validation failure simulation (Mocking bad input reaching logic if DTO passed)
    // Note: DTO validation happens before controller, but logic might fail on business rules in service
    it('should propagate service error for invalid logic', async () => {
      const dto: CreateGameHistoryDto = {
        score: -50, // Assuming negative score is allowed by DTO but rejected by Service logic
        gameType: GameType.BLOCK_TOWER,
      };
      const req = { user: { id: 'test-user' } };

      service.createHistory.mockRejectedValue(
        new BadRequestException('Invalid Score'),
      );

      await expect(controller.createResult(req, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getRanking', () => {
    it('should return ranking list without gameType', async () => {
      const expectedResult = [{ score: 100, gameType: GameType.BLOCK_TOWER }];
      service.getRanking.mockResolvedValue(expectedResult);

      const result = await controller.getRanking();

      expect(service.getRanking).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should return ranking list filtered by gameType', async () => {
      const expectedResult = [{ score: 200, gameType: GameType.SKY_DROP }];
      service.getRanking.mockResolvedValue(expectedResult);

      const result = await controller.getRanking(GameType.SKY_DROP);

      expect(service.getRanking).toHaveBeenCalledWith(GameType.SKY_DROP);
      expect(result).toEqual(expectedResult);
    });

    // Failure Case 1: Service throws error
    it('should throw error if service fails to get ranking', async () => {
      service.getRanking.mockRejectedValue(
        new InternalServerErrorException('DB Connection Fail'),
      );
      await expect(controller.getRanking()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    // Success Case 2 (Implicitly failure check for empty data): Should return empty array if no data
    it('should return empty array if no ranking data exists', async () => {
      service.getRanking.mockResolvedValue([]);
      const result = await controller.getRanking(GameType.BLOCK_TOWER);
      expect(result).toEqual([]);
    });
  });
});
