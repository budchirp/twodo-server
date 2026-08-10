import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { Couple } from '@/modules/couple/entity/couple.entity'
import { User } from '@/modules/user/entity/user.entity'

@Entity('couple_members')
@Index(['userId'], { unique: true })
@Index(['coupleId', 'userId'], { unique: true })
export class CoupleMember {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'couple_id', type: 'varchar' })
  coupleId: string

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string

  @ManyToOne(
    () => Couple,
    (couple) => couple.members,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'couple_id' })
  couple: Couple

  @ManyToOne(
    () => User,
    (user) => user.memberships,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'user_id' })
  user: User

  @CreateDateColumn({ name: 'joined_at', type: 'datetime' })
  joinedAt: Date
}
