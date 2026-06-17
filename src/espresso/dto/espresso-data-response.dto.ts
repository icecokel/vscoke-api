import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EspressoNormalizedDataResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion: 1;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  beans: Record<string, unknown>[];
}

export class EspressoRawEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  beanName: string;

  @ApiProperty({ enum: ['manual', 'import'] })
  source: string;

  @ApiProperty()
  capturedAt: string;

  @ApiProperty()
  text: string;

  @ApiPropertyOptional({ nullable: true })
  normalizedBeanId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  normalizedLogId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  normalizedRoundId?: string | null;
}

export class EspressoRawDataResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion: 1;

  @ApiProperty({ type: [EspressoRawEntryResponseDto] })
  entries: EspressoRawEntryResponseDto[];
}
