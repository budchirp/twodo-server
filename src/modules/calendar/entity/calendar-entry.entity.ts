import {
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Column,
  Entity,
  Index
} from 'typeorm'
import { CalendarSexualActivityDetail } from '@/modules/calendar/entity/calendar-sexual-activity-detail.entity'
import { CalendarPeriodDetail } from '@/modules/calendar/entity/calendar-period-detail.entity'
import { CalendarActivityType } from '@/modules/calendar/entity/calendar.enums'
import { Couple } from '@/modules/couple/entity/couple.entity'
import { User } from '@/modules/user/entity/user.entity'

@Entity('calendar_entries')
@Index(['coupleId', 'date'])
@Index(['createdByUserId'])
export class CalendarEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'couple_id', type: 'varchar' })
  coupleId: string

  @Column({ name: 'created_by_user_id', type: 'varchar' })
  createdByUserId: string

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'varchar' })
  type: CalendarActivityType

  @Column({ default: '', type: 'text' })
  notes: string

  @ManyToOne(
    () => Couple,
    (couple) => couple.calendarEntries,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'couple_id' })
  couple: Couple

  @ManyToOne(
    () => User,
    (user) => user.calendarEntries,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User

  @OneToOne(
    () => CalendarPeriodDetail,
    (detail) => detail.entry
  )
  periodDetail: CalendarPeriodDetail | null

  @OneToOne(
    () => CalendarSexualActivityDetail,
    (detail) => detail.entry
  )
  sexualActivityDetail: CalendarSexualActivityDetail | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date
}
