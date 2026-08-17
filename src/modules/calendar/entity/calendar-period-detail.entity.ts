import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import type {
  CalendarFlowLevel,
  CalendarPeriodEvent,
  CalendarPeriodSymptom
} from '@/modules/calendar/entity/calendar.enums'
import { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'

@Entity('calendar_period_details')
@Index(['entryId'], { unique: true })
export class CalendarPeriodDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'entry_id', type: 'varchar' })
  entryId: string

  @Column({ type: 'varchar' })
  event: CalendarPeriodEvent

  @Column({ name: 'flow_level', nullable: true, type: 'varchar' })
  flowLevel: CalendarFlowLevel | null

  @Column({ nullable: true, type: 'simple-json' })
  symptoms: CalendarPeriodSymptom[] | null

  @OneToOne(
    () => CalendarEntry,
    (entry) => entry.periodDetail,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'entry_id' })
  entry: CalendarEntry
}
