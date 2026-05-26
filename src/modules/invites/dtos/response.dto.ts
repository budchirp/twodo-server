import { UserSummaryDto } from '../../users/dtos/response.dto';
import { InviteStatus } from '../entities/invite.entity';

export type InviteDto = {
  id: string;
  user: UserSummaryDto;
  type: 'sent' | 'received';
  status: InviteStatus;
  createdAt: string;
  updatedAt: string;
};
