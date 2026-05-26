export type UserSummaryDto = {
  id: string;
  username: string;
  displayName: string;
  pictureUrl: string | null;
  gender: string | null;
};

export type UserDto = UserSummaryDto & {
  couple: {
    id: string;
    users: UserSummaryDto[];
    createdAt: string;
    updatedAt: string;
  } | null;
};
