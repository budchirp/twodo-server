import { UserMapper } from '../users/user.mapper';
import { InviteDto } from './dtos/response.dto';
import { Invite } from './entities/invite.entity';

export class InviteMapper {
  static toInviteResponse(invite: Invite, currentUserId: string): InviteDto {
    const inviteWasSentByCurrentUser = invite.senderId === currentUserId;

    return {
      id: invite.id,
      user: UserMapper.toUserSummary(
        inviteWasSentByCurrentUser ? invite.receiver : invite.sender,
      ),
      type: inviteWasSentByCurrentUser ? 'sent' : 'received',
      status: invite.status,
      createdAt: invite.createdAt.toISOString(),
      updatedAt: invite.updatedAt.toISOString(),
    };
  }
}
