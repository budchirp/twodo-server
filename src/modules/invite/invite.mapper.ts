import type { Invite } from '@/modules/invite/entity/invite.entity'
import type { InviteDto } from '@/modules/invite/dto/response.dto'
import { UserMapper } from '@/modules/user/user.mapper'

export class InviteMapper {
  static toInviteResponse(invite: Invite, currentUserId: string): InviteDto {
    const inviteWasSentByCurrentUser = invite.senderId === currentUserId

    return {
      id: invite.id,
      user: UserMapper.toUserSummary(inviteWasSentByCurrentUser ? invite.receiver : invite.sender),
      type: inviteWasSentByCurrentUser ? 'sent' : 'received',
      status: invite.status,
      createdAt: invite.createdAt.toISOString(),
      updatedAt: invite.updatedAt.toISOString()
    }
  }
}
