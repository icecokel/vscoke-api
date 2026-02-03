import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from './entities/word.entity';

@Injectable()
export class WordleService {
  constructor(
    @InjectRepository(Word)
    private wordRepository: Repository<Word>,
  ) {}

  /**
   * DB에서 랜덤한 5글자 단어를 조회합니다.
   * @returns 랜덤 단어
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
   * DB에 저장된 단어 개수를 반환합니다.
   * @returns 단어 개수
   */
  async getWordCount(): Promise<number> {
    return this.wordRepository.count();
  }
}
