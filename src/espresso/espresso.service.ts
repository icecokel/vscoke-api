import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEspressoRawEntryDto } from './dto/create-espresso-raw-entry.dto';
import { EspressoBean } from './entities/espresso-bean.entity';
import { EspressoRawEntry } from './entities/espresso-raw-entry.entity';
import {
  EspressoNormalizedData,
  EspressoRawData,
  EspressoRawEntryRecord,
} from './espresso.types';

@Injectable()
export class EspressoService {
  constructor(
    @InjectRepository(EspressoBean)
    private readonly espressoBeanRepository: Repository<EspressoBean>,
    @InjectRepository(EspressoRawEntry)
    private readonly espressoRawEntryRepository: Repository<EspressoRawEntry>,
  ) {}

  async getNormalizedData(): Promise<EspressoNormalizedData> {
    const beans = await this.espressoBeanRepository.find({
      order: { createdAt: 'ASC' },
    });

    return {
      schemaVersion: 1,
      beans: beans.map((bean) => bean.payload),
    };
  }

  async getRawData(): Promise<EspressoRawData> {
    const entries = await this.espressoRawEntryRepository.find({
      order: { capturedAt: 'ASC', createdAt: 'ASC' },
    });

    return {
      schemaVersion: 1,
      entries: entries.map((entry) => this.toRawEntryRecord(entry)),
    };
  }

  async createRawEntry(
    createEspressoRawEntryDto: CreateEspressoRawEntryDto,
  ): Promise<EspressoRawEntryRecord> {
    const entry = this.espressoRawEntryRepository.create(
      createEspressoRawEntryDto,
    );
    const savedEntry = await this.espressoRawEntryRepository.save(entry);

    return this.toRawEntryRecord(savedEntry);
  }

  private toRawEntryRecord(entry: EspressoRawEntry): EspressoRawEntryRecord {
    return {
      id: entry.id,
      beanName: entry.beanName,
      source: entry.source,
      capturedAt: entry.capturedAt,
      text: entry.text,
      normalizedBeanId: entry.normalizedBeanId,
      normalizedLogId: entry.normalizedLogId,
      normalizedRoundId: entry.normalizedRoundId,
    };
  }
}
