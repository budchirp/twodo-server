import { CalendarEntry } from '../../modules/calendar/entities/calendar-entry.entity';
import { CalendarPeriodDetail } from '../../modules/calendar/entities/calendar-period-detail.entity';
import { CalendarSexualActivityDetail } from '../../modules/calendar/entities/calendar-sexual-activity-detail.entity';
import { Couple } from '../../modules/couples/entities/couple.entity';
import { CoupleMember } from '../../modules/couples/entities/couple-member.entity';
import { Invite } from '../../modules/invites/entities/invite.entity';
import { Note } from '../../modules/notes/entities/note.entity';
import { User } from '../../modules/users/entities/user.entity';

export const entities = [
  User,
  Couple,
  CoupleMember,
  Invite,
  Note,
  CalendarEntry,
  CalendarPeriodDetail,
  CalendarSexualActivityDetail,
];
