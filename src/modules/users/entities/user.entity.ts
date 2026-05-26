import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CoupleMember } from '../../couples/entities/couple-member.entity';
import { Invite } from '../../invites/entities/invite.entity';

@Entity('users')
export class User {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ name: 'display_name', type: 'varchar' })
  displayName: string;

  @Column({ name: 'picture_url', nullable: true, type: 'varchar' })
  pictureUrl: string | null;

  @Column({ nullable: true, type: 'varchar' })
  gender: string | null;

  @OneToMany(() => CoupleMember, (member) => member.user)
  memberships: CoupleMember[];

  @OneToMany(() => Invite, (invite) => invite.sender)
  sentInvites: Invite[];

  @OneToMany(() => Invite, (invite) => invite.receiver)
  receivedInvites: Invite[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
