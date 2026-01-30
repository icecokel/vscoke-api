import { ApiProperty } from '@nestjs/swagger';
import { GameType } from '../enums/game-type.enum';

export class GameHistoryUserDto {
  @ApiProperty({ description: '사용자 닉네임', example: '홍길동' })
  displayName: string;
}

export class GameHistoryResponseDto {
  @ApiProperty({
    description: '게임 기록 ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ description: '점수', example: 100 })
  score: number;

  @ApiProperty({
    description: '게임 타입',
    enum: GameType,
    example: GameType.BLOCK_TOWER,
  })
  gameType: GameType;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-30T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({ description: '사용자 정보', type: GameHistoryUserDto })
  user: GameHistoryUserDto;
}
