import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity()
export class GameHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  score: number;

  @Column({ nullable: true })
  playTime: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  user: User;
}
