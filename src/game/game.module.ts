import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameHistory } from './entities/game-history.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameHistory]),
    AuthModule, // GoogleAuthGuard 사용을 위해 import
  ],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
