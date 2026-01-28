import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { GoogleAuthGuard } from '../auth/google-auth.guard';
import { ExecutionContext } from '@nestjs/common';
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
      const req = { user: { id: 'test-user' } };
      const expectedResult = { id: 1, ...dto, user: req.user };

      service.createHistory.mockResolvedValue(expectedResult);

      const result = await controller.createResult(req, dto);

      expect(service.createHistory).toHaveBeenCalledWith(req.user, dto);
      expect(result).toEqual(expectedResult);
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
  });
});
