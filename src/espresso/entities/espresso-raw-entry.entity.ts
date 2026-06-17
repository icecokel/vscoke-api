import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { EspressoRawEntrySource } from '../espresso.types';

@Entity('espresso_raw_entries')
export class EspressoRawEntry {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  beanName: string;

  @Column({ type: 'varchar' })
  source: EspressoRawEntrySource;

  @Column({ type: 'date' })
  capturedAt: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', nullable: true })
  normalizedBeanId: string | null;

  @Column({ type: 'varchar', nullable: true })
  normalizedLogId: string | null;

  @Column({ type: 'varchar', nullable: true })
  normalizedRoundId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
