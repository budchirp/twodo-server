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
import { User } from '../../users/entities/user.entity';

export enum InviteStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

@Entity('invites')
@Index(['senderId'])
@Index(['receiverId'])
@Index(['senderId', 'receiverId', 'status'])
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sender_id', type: 'varchar' })
  senderId: string;

  @Column({ name: 'receiver_id', type: 'varchar' })
  receiverId: string;

  @Column({ type: 'varchar' })
  status: InviteStatus;

  @ManyToOne(() => User, (user) => user.sentInvites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedInvites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
