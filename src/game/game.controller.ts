import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GameService } from './game.service';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { GoogleAuthGuard } from '../auth/google-auth.guard';
import { GameType } from './enums/game-type.enum';

@ApiTags('Game')
@ApiBearerAuth()
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('result')
  @UseGuards(GoogleAuthGuard)
  async createResult(
    @Req() req: any,
    @Body() createGameHistoryDto: CreateGameHistoryDto,
  ) {
    return this.gameService.createHistory(req.user, createGameHistoryDto);
  }

  @Get('ranking')
  async getRanking(@Query('gameType') gameType?: GameType) {
    return this.gameService.getRanking(gameType);
  }
}
