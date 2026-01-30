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
    // 유저별 최고 점수만 가져오기 위한 서브쿼리
    const subQuery = this.gameHistoryRepository
      .createQueryBuilder('gh')
      .select('gh.userId', 'userId')
      .addSelect('MAX(gh.score)', 'maxScore')
      .groupBy('gh.userId');

    if (gameType) {
      subQuery.where('gh.gameType = :gameType', { gameType });
    }

    // 메인 쿼리: 서브쿼리 결과와 조인하여 최고 점수 기록만 선택
    const query = this.gameHistoryRepository
      .createQueryBuilder('gameHistory')
      .innerJoin(
        `(${subQuery.getQuery()})`,
        'topScores',
        'gameHistory.userId = topScores.userId AND gameHistory.score = topScores.maxScore',
      )
      .leftJoinAndSelect('gameHistory.user', 'user')
      .orderBy('gameHistory.score', 'DESC')
      .addOrderBy('gameHistory.createdAt', 'ASC') // 동점자는 먼저 달성한 사람 우선
      .take(10);

    if (gameType) {
      query.where('gameHistory.gameType = :gameType', { gameType });
    }

    // 서브쿼리 파라미터 설정
    query.setParameters(subQuery.getParameters());

    return query.getMany();
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

  /**
   * 유저의 현재 등수를 계산합니다 (해당 게임 타입 기준)
   * @param userId 유저 ID
   * @param score 현재 점수
   * @param gameType 게임 타입
   * @returns 등수 (1부터 시작)
   */
  async getUserRank(
    userId: string,
    score: number,
    gameType: GameType,
  ): Promise<number> {
    // 유저별 최고 점수 서브쿼리
    const subQuery = this.gameHistoryRepository
      .createQueryBuilder('gh')
      .select('gh.userId', 'userId')
      .addSelect('MAX(gh.score)', 'maxScore')
      .where('gh.gameType = :gameType', { gameType })
      .groupBy('gh.userId');

    // 현재 유저보다 높은 점수를 가진 유저 수 계산
    const result = await this.gameHistoryRepository
      .createQueryBuilder('gameHistory')
      .select('COUNT(DISTINCT gameHistory.userId)', 'count')
      .innerJoin(
        `(${subQuery.getQuery()})`,
        'topScores',
        'gameHistory.userId = topScores.userId AND gameHistory.score = topScores.maxScore',
      )
      .where('gameHistory.gameType = :gameType', { gameType })
      .andWhere('topScores.maxScore > :score', { score })
      .setParameters({ ...subQuery.getParameters(), score, gameType })
      .getRawOne();

    // 나보다 높은 유저 수 + 1 = 내 등수
    return parseInt(result?.count || '0', 10) + 1;
  }
}
