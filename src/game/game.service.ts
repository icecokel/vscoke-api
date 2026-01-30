import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory } from './entities/game-history.entity';
import { User } from '../auth/entities/user.entity';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { GameType } from './enums/game-type.enum';

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

  async getRanking(gameType?: GameType): Promise<GameHistory[]> {
    return this.gameHistoryRepository.find({
      order: {
        score: 'DESC',
      },
      where: {
        gameType: gameType,
      },
      take: 10,
      relations: ['user'], // 유저 정보 포함
    });
  }
  async findHistoryById(id: string): Promise<GameHistory> {
    const history = await this.gameHistoryRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!history) {
      throw new NotFoundException('Game history not found');
    }

    return history;
  }
}
