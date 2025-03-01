import { SetMetadata } from '@nestjs/common';

export const GuardMetadata = (...guards: string[]) => SetMetadata('guards', guards);

// Usage:
// @Guards('Guard1-Name', 'Guard2-Name', ..., 'GuardN-Name')
// Note: To ignore authentication of a handler/function, add @Guard() decorator on it.

export const JwtAuthGuard = 'JwtAuthGuard'
// NOTE: Implementation can be changed and an optional jwt auth guard can be added which returns true but since this implementation is tested in real world project, keep it like that.
export const OptionalJwtAuthGuard = 'OptionalJwtAuthGuard' 
export const LocalAuthGuard = 'LocalAuthGuard'

// Usage:
// Use these variable in guard rather than passing strings directly as it can lead to bugs in case of typo
// Example: @Guard(JwtAuthGuard)