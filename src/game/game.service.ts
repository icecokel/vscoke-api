import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory } from './entities/game-history.entity';
import { User } from '../auth/entities/user.entity';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { GameType } from './enums/game-type.enum';

/**
 * 게임 비즈니스 로직을 처리하는 서비스
 */
@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
  ) {}

  /**
   * 유저의 최고 점수 조회 (기간 필터링 지원)
   */
  async getUserBestScore(
    userId: string,
    gameType: GameType,
    dateRange?: { start: Date; end: Date },
  ): Promise<number> {
    const query = this.gameHistoryRepository
      .createQueryBuilder('gh')
      .select('MAX(gh.score)', 'maxScore')
      .where('gh.userId = :userId', { userId })
      .andWhere('gh.gameType = :gameType', { gameType });

    if (dateRange) {
      query.andWhere('gh.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    const result = await query.getRawOne();
    return result?.maxScore ? parseInt(result.maxScore, 10) : 0;
  }

  /**
   * 새로운 게임 기록을 생성하고 저장함
   */
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

  /**
   * 게임별 랭킹 목록을 조회함 (유저별 최고 점수 기준 Top 10)
   */
  async getRanking(gameType?: GameType): Promise<GameHistory[]> {
    // 유저별 최고 점수만 추출하기 위한 서브쿼리
    const subQuery = this.gameHistoryRepository
      .createQueryBuilder('gh')
      .select('gh.userId', 'userId')
      .addSelect('MAX(gh.score)', 'maxScore')
      .groupBy('gh.userId');

    if (gameType) {
      subQuery.where('gh.gameType = :gameType', { gameType });
    }

    // 메인 쿼리: 서브쿼리 결과와 조인하여 상세 기록 및 유저 정보를 포함한 Top 10 추출
    const query = this.gameHistoryRepository
      .createQueryBuilder('gameHistory')
      .innerJoin(
        `(${subQuery.getQuery()})`,
        'topScores',
        'gameHistory.userId = topScores.userId AND gameHistory.score = topScores.maxScore',
      )
      .leftJoinAndSelect('gameHistory.user', 'user')
      .orderBy('gameHistory.score', 'DESC') // 점수 높은 순
      .addOrderBy('gameHistory.createdAt', 'ASC') // 같은 점수일 경우 먼저 기록한 유저 우선
      .take(10); // 최대 10위까지

    if (gameType) {
      query.where('gameHistory.gameType = :gameType', { gameType });
    }

    // 서브쿼리 파라미터 적용
    query.setParameters(subQuery.getParameters());

    return query.getMany();
  }

  /**
   * ID를 기준으로 특정 게임 기록을 조회함
   */
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
   * 사용자의 특정 점수에 대한 현재 전체 등수를 계산함
   * @param userId 사용자 ID
   * @param score 현재 점수
   * @param gameType 게임 타입
   * @returns 등수 (1부터 시작)
   */
  async getUserRank(
    userId: string,
    score: number,
    gameType: GameType,
    dateRange?: { start: Date; end: Date },
  ): Promise<number> {
    // 유저별 최고 점수 리스트를 구하는 서브쿼리
    const subQuery = this.gameHistoryRepository
      .createQueryBuilder('gh')
      .select('gh.userId', 'userId')
      .addSelect('MAX(gh.score)', 'maxScore')
      .where('gh.gameType = :gameType', { gameType })
      .groupBy('gh.userId');

    if (dateRange) {
      subQuery.andWhere('gh.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    // 현재 점수보다 높은 점수를 가진 고유 유저들의 수를 계산
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
      .setParameters({
        ...subQuery.getParameters(),
        score,
        gameType,
        start: dateRange?.start,
        end: dateRange?.end,
      })
      .getRawOne();

    // (나보다 높은 유저 수) + 1 = 현재 나의 등수
    return parseInt(result?.count || '0', 10) + 1;
  }
}
