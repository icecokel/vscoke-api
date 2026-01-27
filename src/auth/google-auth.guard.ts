import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class GoogleAuthGuard implements CanActivate {
  private client = new OAuth2Client();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        // audience: process.env.GOOGLE_CLIENT_ID, // 생략 시 모든 클라이언트 ID 허용 (주의)
      });
      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const { email, given_name, family_name, sub } = payload;

      // 사용자 조회 또는 생성 (Upsert)
      let user = await this.userRepository.findOne({ where: { id: sub } });

      if (!user) {
        user = this.userRepository.create({
          id: sub, // Google ID를 PK로 사용
          email: email,
          firstName: given_name || '',
          lastName: family_name || '',
        });
        await this.userRepository.save(user);
      } else {
        // 이름 등 정보 업데이트가 필요하면 여기서 업데이트 로직 추가 가능
      }

      request['user'] = user;
      return true;
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
