import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { GameService } from './game.service';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { GameHistoryResponseDto } from './dto/game-history-response.dto';
import { GoogleAuthGuard } from '../auth/google-auth.guard';
import { GameType } from './enums/game-type.enum';

@ApiTags('Game')
@ApiBearerAuth()
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

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

  @Get('ranking')
  async getRanking(@Query('gameType') gameType?: GameType) {
    return this.gameService.getRanking(gameType);
  }
}
