import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { GameService } from './game.service';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { GameHistoryResponseDto } from './dto/game-history-response.dto';
import { GoogleAuthGuard } from '../auth/google-auth.guard';
import { GameType } from './enums/game-type.enum';

/**
 * 게임 결과 관리 및 랭킹 조회를 담당하는 컨트롤러
 */
@ApiTags('Game')
@ApiBearerAuth()
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  /**
   * 게임 결과 저장 및 현재 등수 반환
   */
  @Post('result')
  @UseGuards(GoogleAuthGuard)
  @ApiOkResponse({ type: GameHistoryResponseDto })
  async createResult(
    @Req() req: any,
    @Body() createGameHistoryDto: CreateGameHistoryDto,
  ): Promise<GameHistoryResponseDto> {
    const history = await this.gameService.createHistory(
      req.user,
      createGameHistoryDto,
    );

    // 현재 등수 계산
    const rank = await this.gameService.getUserRank(
      req.user.id,
      history.score,
      history.gameType,
    );

    return {
      id: history.id,
      score: history.score,
      gameType: history.gameType,
      createdAt: history.createdAt,
      user: {
        displayName: `${history.user.firstName} ${history.user.lastName}`,
      },
      rank,
    };
  }

  /**
   * 게임별 랭킹 목록 조회 (Top 10)
   */
  @Get('ranking')
  async getRanking(@Query('gameType') gameType?: GameType) {
    return this.gameService.getRanking(gameType);
  }

  /**
   * 특정 게임 결과 상세 조회 (ID 기준, 공유용)
   */
  @Get('result/:id')
  @ApiOkResponse({
    type: GameHistoryResponseDto,
    description: '공유된 게임 결과 조회 (로그인 필요 없음)',
  })
  async getGameResult(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GameHistoryResponseDto> {
    const history = await this.gameService.findHistoryById(id);

    return {
      id: history.id,
      score: history.score,
      gameType: history.gameType,
      createdAt: history.createdAt,
      user: {
        displayName: `${history.user.firstName} ${history.user.lastName}`,
      },
    };
  }
}
