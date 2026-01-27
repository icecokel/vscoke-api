import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory } from './entities/game-history.entity';
import { User } from '../auth/entities/user.entity';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
  ) {}

  async createHistory(
    user: User,
    createGameHistoryDto: CreateGameHistoryDto,
  ): Promise<GameHistory> {
    const history = this.gameHistoryRepository.create({
      ...createGameHistoryDto,
      user: user,
    });
    return this.gameHistoryRepository.save(history);
  }

  async getRanking(): Promise<GameHistory[]> {
    return this.gameHistoryRepository.find({
      order: {
        score: 'DESC',
      },
      take: 10,
      relations: ['user'], // 유저 정보 포함
    });
  }
}
