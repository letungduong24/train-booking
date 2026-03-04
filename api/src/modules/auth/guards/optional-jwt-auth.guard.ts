import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard — populates req.user if a valid token exists,
 * but does NOT throw an error if the token is missing or invalid.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(_err: any, user: any) {
        // Return user if valid, null otherwise (no exception)
        return user ?? null;
    }

    canActivate(context: ExecutionContext) {
        // Always allow, but try to authenticate
        return super.canActivate(context);
    }
}
