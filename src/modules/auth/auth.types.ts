import type { User } from '@/modules/user/entity/user.entity'
import type { Request } from 'express'

export type ExternalAuthUser = {
  id: string
  username: string
  profile: {
    name?: string | null
    picture?: string | null
    gender?: string | null
  }
}

export type AuthContext = {
  externalUser: ExternalAuthUser
  user: User | null
}

export type AuthenticatedRequest = Request & {
  auth: AuthContext
}
