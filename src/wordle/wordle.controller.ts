import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { WordleService } from './wordle.service';
import { WordResponseDto } from './dto/word-response.dto';

/**
 * 워들 게임 관련 API를 제공하는 컨트롤러
 */
@ApiTags('Wordle')
@Controller('wordle')
export class WordleController {
  constructor(private readonly wordleService: WordleService) {}

  /**
   * 랜덤한 5글자 영단어를 반환함
   */
  @Get('word')
  @ApiOperation({ summary: '랜덤 5글자 단어 조회' })
  @ApiOkResponse({
    type: WordResponseDto,
    description: '랜덤으로 선택된 5글자 영단어',
  })
  async getRandomWord(): Promise<WordResponseDto> {
    const wordEntity = await this.wordleService.getRandomWord();
    return { word: wordEntity.word };
  }
}
