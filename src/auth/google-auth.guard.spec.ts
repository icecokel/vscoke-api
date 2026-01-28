import { GoogleAuthGuard } from './google-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { ErrorMessage } from '../common/constants/message.constant';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;
  let mockUserRepository;
  let mockClient;

  beforeEach(() => {
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    guard = new GoogleAuthGuard(mockUserRepository);
    mockClient = {
      verifyIdToken: jest.fn(),
    };
    (guard as any).client = mockClient;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException if no token provided', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as any;

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException(ErrorMessage.AUTH.NO_TOKEN),
      );
    });

    it('should throw UnauthorizedException if email is missing', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer valid-token' },
          }),
        }),
      } as any;

      mockClient.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: '123',
          // email missing
        }),
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException(ErrorMessage.AUTH.EMAIL_REQUIRED),
      );
    });

    it('should return true and attach user if token and email are valid', async () => {
      const mockRequest: any = {
        headers: { authorization: 'Bearer valid-token' },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const payload = {
        sub: '123',
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
      };

      mockClient.verifyIdToken.mockResolvedValue({
        getPayload: () => payload,
      });

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        ...payload,
        id: payload.sub,
      });
      mockUserRepository.save.mockResolvedValue({
        ...payload,
        id: payload.sub,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRequest['user']).toBeDefined();
      expect(mockRequest['user'].email).toBe(payload.email);
    });
  });
});
