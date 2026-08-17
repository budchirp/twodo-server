import type { CreateInviteDto, HandleInviteDto } from '@/modules/invite/dto/request.dto'
import { InviteAction } from '@/modules/invite/dto/request.dto'
import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { Invite, InviteStatus } from '@/modules/invite/entity/invite.entity'
import { ApiException } from '@/core/exception/api.exception'
import { Couple } from '@/modules/couple/entity/couple.entity'
import type { InviteDto } from '@/modules/invite/dto/response.dto'
import { User } from '@/modules/user/entity/user.entity'
import { InviteMapper } from '@/modules/invite/invite.mapper'
import { DataSource, In, type Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { HttpStatus, Injectable } from '@nestjs/common'

@Injectable()
export class InviteService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Invite)
    private readonly invites: Repository<Invite>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(CoupleMember)
    private readonly members: Repository<CoupleMember>
  ) {}

  async listInvites(user: User | null): Promise<InviteDto[]> {
    if (!user) throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND)

    const invites = await this.invites.find({
      where: [{ senderId: user.id }, { receiverId: user.id }],
      relations: { sender: true, receiver: true },
      order: { createdAt: 'DESC' }
    })

    return invites.map((invite) => InviteMapper.toInviteResponse(invite, user.id))
  }

  async createInvite(user: User | null, body: CreateInviteDto): Promise<InviteDto> {
    if (!user) throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND)

    const receiver = await this.users.findOne({ where: { username: body.username } })
    if (!receiver) throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND)
    if (receiver.id === user.id) throw new ApiException('error.self_invite', HttpStatus.BAD_REQUEST)

    const existingMemberships = await this.members.find({
      where: { userId: In([user.id, receiver.id]) }
    })
    if (existingMemberships.some((m) => m.userId === user.id))
      throw new ApiException('error.sender_in_couple', HttpStatus.CONFLICT)
    if (existingMemberships.some((m) => m.userId === receiver.id))
      throw new ApiException('error.receiver_in_couple', HttpStatus.CONFLICT)

    const duplicate = await this.invites.findOne({
      where: [
        { senderId: user.id, receiverId: receiver.id, status: InviteStatus.Pending },
        { senderId: receiver.id, receiverId: user.id, status: InviteStatus.Pending }
      ]
    })
    if (duplicate) throw new ApiException('error.duplicate_invite', HttpStatus.CONFLICT)

    const invite = this.invites.create({
      senderId: user.id,
      receiverId: receiver.id,
      status: InviteStatus.Pending
    })
    try {
      await this.invites.save(invite)
    } catch {
      throw new ApiException('error.invite_send_failed', HttpStatus.INTERNAL_SERVER_ERROR)
    }

    invite.sender = user
    invite.receiver = receiver
    return InviteMapper.toInviteResponse(invite, user.id)
  }

  async handleInvite(user: User | null, id: string, body: HandleInviteDto): Promise<null> {
    if (!user) throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND)

    return this.dataSource.transaction(async (manager) => {
      const invite = await manager.findOne(Invite, {
        where: { id },
        relations: { sender: true, receiver: true }
      })

      if (!invite) throw new ApiException('error.invite_not_found', HttpStatus.NOT_FOUND)
      if (invite.receiverId !== user.id)
        throw new ApiException('error.not_invite_receiver', HttpStatus.FORBIDDEN)
      if (invite.status !== InviteStatus.Pending)
        throw new ApiException('error.invite_not_pending', HttpStatus.CONFLICT)

      if (body.action === InviteAction.Reject) {
        invite.status = InviteStatus.Rejected
        await manager.save(Invite, invite)
        return null
      }

      const memberships = await manager.find(CoupleMember, {
        where: { userId: In([invite.senderId, invite.receiverId]) }
      })
      if (memberships.some((m) => m.userId === invite.senderId))
        throw new ApiException('error.sender_in_couple', HttpStatus.CONFLICT)
      if (memberships.some((m) => m.userId === invite.receiverId))
        throw new ApiException('error.receiver_in_couple', HttpStatus.CONFLICT)

      const couple = await manager.save(Couple, manager.create(Couple, {}))
      await manager.save(CoupleMember, [
        manager.create(CoupleMember, { coupleId: couple.id, userId: invite.senderId }),
        manager.create(CoupleMember, { coupleId: couple.id, userId: invite.receiverId })
      ])

      invite.status = InviteStatus.Accepted
      await manager.save(Invite, invite)
      return null
    })
  }
}
