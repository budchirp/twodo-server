import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Couple } from '../../couples/entities/couple.entity';

@Entity('notes')
@Index(['coupleId'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'couple_id', type: 'varchar' })
  coupleId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ default: '', type: 'text' })
  content: string;

  @ManyToOne(() => Couple, (couple) => couple.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couple_id' })
  couple: Couple;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
