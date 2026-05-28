import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CalendarEntry } from '../../calendar/entities/calendar-entry.entity';
import { CoupleMember } from '../../couples/entities/couple-member.entity';
import { Invite } from '../../invites/entities/invite.entity';

export enum UserGender {
  Female = 'female',
  Male = 'male',
}

@Entity('users')
export class User {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'picture', nullable: true, type: 'varchar' })
  picture: string | null;

  @Column({ nullable: true, type: 'varchar' })
  gender: UserGender | null;

  @OneToMany(() => CoupleMember, (member) => member.user)
  memberships: CoupleMember[];

  @OneToMany(() => Invite, (invite) => invite.sender)
  sentInvites: Invite[];

  @OneToMany(() => Invite, (invite) => invite.receiver)
  receivedInvites: Invite[];

  @OneToMany(() => CalendarEntry, (entry) => entry.createdByUser)
  calendarEntries: CalendarEntry[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
