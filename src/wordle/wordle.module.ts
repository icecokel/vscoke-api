import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WordleController } from './wordle.controller';
import { WordleService } from './wordle.service';
import { Word } from './entities/word.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Word])],
  controllers: [WordleController],
  providers: [WordleService],
  exports: [WordleService],
})
export class WordleModule {}
