import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Couple } from '../../couples/entities/couple.entity';
import { User } from '../../users/entities/user.entity';
import { CalendarActivityType } from './calendar.enums';
import { CalendarPeriodDetail } from './calendar-period-detail.entity';
import { CalendarSexualActivityDetail } from './calendar-sexual-activity-detail.entity';

@Entity('calendar_entries')
@Index(['coupleId', 'date'])
@Index(['createdByUserId'])
export class CalendarEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'couple_id', type: 'varchar' })
  coupleId: string;

  @Column({ name: 'created_by_user_id', type: 'varchar' })
  createdByUserId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar' })
  type: CalendarActivityType;

  @Column({ default: '', type: 'text' })
  notes: string;

  @ManyToOne(() => Couple, (couple) => couple.calendarEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'couple_id' })
  couple: Couple;

  @ManyToOne(() => User, (user) => user.calendarEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @OneToOne(() => CalendarPeriodDetail, (detail) => detail.entry)
  periodDetail: CalendarPeriodDetail | null;

  @OneToOne(() => CalendarSexualActivityDetail, (detail) => detail.entry)
  sexualActivityDetail: CalendarSexualActivityDetail | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
