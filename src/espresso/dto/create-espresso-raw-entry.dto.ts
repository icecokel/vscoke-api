import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { EspressoRawEntrySource } from '../espresso.types';

export class CreateEspressoRawEntryDto {
  @ApiProperty({ example: 'raw-momos-es-chocolat-round-001' })
  @IsString()
  id: string;

  @ApiProperty({ example: '원두 에스쇼콜라' })
  @IsString()
  beanName: string;

  @ApiProperty({ enum: ['manual', 'import'], example: 'manual' })
  @IsIn(['manual', 'import'])
  source: EspressoRawEntrySource;

  @ApiProperty({ example: '2026-06-17' })
  @IsString()
  capturedAt: string;

  @ApiProperty({ example: '추출 기록 원문' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ example: 'bean-momos-es-chocolat' })
  @IsOptional()
  @IsString()
  normalizedBeanId?: string | null;

  @ApiPropertyOptional({ example: 'log-momos-es-chocolat-espresso-001' })
  @IsOptional()
  @IsString()
  normalizedLogId?: string | null;

  @ApiPropertyOptional({ example: 'round-001' })
  @IsOptional()
  @IsString()
  normalizedRoundId?: string | null;
}
