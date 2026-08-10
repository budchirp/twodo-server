import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'
import {
  CalendarEjaculationLocation,
  CalendarProtectionMethod
} from '@/modules/calendar/entity/calendar.enums'

@Entity('calendar_sexual_activity_details')
@Index(['entryId'], { unique: true })
export class CalendarSexualActivityDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'entry_id', type: 'varchar' })
  entryId: string

  @Column({ name: 'sex_occurred', type: 'boolean' })
  sexOccurred: boolean

  @Column({ name: 'protection_method', type: 'varchar' })
  protectionMethod: CalendarProtectionMethod

  @Column({ name: 'ejaculation_location', type: 'varchar' })
  ejaculationLocation: CalendarEjaculationLocation

  @OneToOne(
    () => CalendarEntry,
    (entry) => entry.sexualActivityDetail,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({ name: 'entry_id' })
  entry: CalendarEntry
}
