import {
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'
import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { Note } from '@/modules/note/entity/note.entity'

@Entity('couples')
export class Couple {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @OneToMany(
    () => CoupleMember,
    (member) => member.couple
  )
  members: CoupleMember[]

  @OneToMany(
    () => Note,
    (note) => note.couple
  )
  notes: Note[]

  @OneToMany(
    () => CalendarEntry,
    (entry) => entry.couple
  )
  calendarEntries: CalendarEntry[]

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date
}
