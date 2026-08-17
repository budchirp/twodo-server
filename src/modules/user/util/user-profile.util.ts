import { type User, UserGender } from '@/modules/user/entity/user.entity'

export function isUserGender(value: unknown): value is UserGender {
  return value === UserGender.Female || value === UserGender.Male
}

export function isUserProfileCompleted(user: Pick<User, 'gender' | 'name'> | null): user is User {
  return !!user && user.name.trim() !== '' && isUserGender(user.gender)
}
