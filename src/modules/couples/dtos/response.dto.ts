import { UserSummaryDto } from '../../users/dtos/response.dto';

export type CoupleDto = {
  id: string;
  users: UserSummaryDto[];
  createdAt: string;
  updatedAt: string;
};
