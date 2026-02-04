import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from './entities/word.entity';

/**
 * 워들 게임의 데이터 관리를 담당하는 서비스
 */
@Injectable()
export class WordleService {
  constructor(
    @InjectRepository(Word)
    private wordRepository: Repository<Word>,
  ) {}

  /**
   * 데이터베이스에서 랜덤한 5글자 단어 하나를 조회함
   * @returns 랜덤 단어 엔티티
   */
  async getRandomWord(): Promise<Word> {
    const word = await this.wordRepository
      .createQueryBuilder('word')
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();

    if (!word) {
      throw new NotFoundException('단어가 존재하지 않습니다.');
    }

    return word;
  }

  /**
   * 현재 데이터베이스에 등록된 전체 단어 개수를 반환함
   */
  async getWordCount(): Promise<number> {
    return this.wordRepository.count();
  }
}
