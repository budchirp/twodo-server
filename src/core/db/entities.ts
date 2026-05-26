import { Couple } from '../../modules/couples/entities/couple.entity';
import { CoupleMember } from '../../modules/couples/entities/couple-member.entity';
import { Invite } from '../../modules/invites/entities/invite.entity';
import { Note } from '../../modules/notes/entities/note.entity';
import { User } from '../../modules/users/entities/user.entity';

export const entities = [User, Couple, CoupleMember, Invite, Note];
