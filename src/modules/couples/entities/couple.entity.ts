import {
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Note } from '../../notes/entities/note.entity';
import { CoupleMember } from './couple-member.entity';

@Entity('couples')
export class Couple {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => CoupleMember, (member) => member.couple)
  members: CoupleMember[];

  @OneToMany(() => Note, (note) => note.couple)
  notes: Note[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
