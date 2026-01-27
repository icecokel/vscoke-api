import { IsNumber, IsOptional } from 'class-validator';

export class CreateGameHistoryDto {
  @IsNumber()
  score: number;

  @IsNumber()
  @IsOptional()
  playTime?: number;
}
