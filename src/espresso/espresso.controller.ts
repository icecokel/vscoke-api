import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateEspressoRawEntryDto } from './dto/create-espresso-raw-entry.dto';
import {
  EspressoNormalizedDataResponseDto,
  EspressoRawDataResponseDto,
  EspressoRawEntryResponseDto,
} from './dto/espresso-data-response.dto';
import { EspressoService } from './espresso.service';
import {
  EspressoNormalizedData,
  EspressoRawData,
  EspressoRawEntryRecord,
} from './espresso.types';

@ApiTags('Espresso')
@Controller('espresso')
export class EspressoController {
  constructor(private readonly espressoService: EspressoService) {}

  @Get()
  @ApiOperation({ summary: '정규화된 에스프레소 원두 기록 조회' })
  @ApiOkResponse({ type: EspressoNormalizedDataResponseDto })
  async getNormalizedData(): Promise<EspressoNormalizedData> {
    return this.espressoService.getNormalizedData();
  }

  @Get('raw')
  @ApiOperation({ summary: '에스프레소 raw 기록 조회' })
  @ApiOkResponse({ type: EspressoRawDataResponseDto })
  async getRawData(): Promise<EspressoRawData> {
    return this.espressoService.getRawData();
  }

  @Post('raw')
  @ApiOperation({ summary: '에스프레소 raw 기록 생성' })
  @ApiCreatedResponse({ type: EspressoRawEntryResponseDto })
  async createRawEntry(
    @Body() createEspressoRawEntryDto: CreateEspressoRawEntryDto,
  ): Promise<EspressoRawEntryRecord> {
    return this.espressoService.createRawEntry(createEspressoRawEntryDto);
  }
}
