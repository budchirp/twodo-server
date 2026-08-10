import { CalendarSexualActivityDetail } from '@/modules/calendar/entity/calendar-sexual-activity-detail.entity'
import { CalendarPeriodDetail } from '@/modules/calendar/entity/calendar-period-detail.entity'
import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'
import { Invite } from '@/modules/invite/entity/invite.entity'
import { Couple } from '@/modules/couple/entity/couple.entity'
import { User } from '@/modules/user/entity/user.entity'
import { Note } from '@/modules/note/entity/note.entity'

export const entities = [
  User,
  Couple,
  CoupleMember,
  Invite,
  Note,
  CalendarEntry,
  CalendarPeriodDetail,
  CalendarSexualActivityDetail
]
