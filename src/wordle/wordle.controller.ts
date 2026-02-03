import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { WordleService } from './wordle.service';
import { WordResponseDto } from './dto/word-response.dto';

@ApiTags('Wordle')
@Controller('wordle')
export class WordleController {
  constructor(private readonly wordleService: WordleService) {}

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
