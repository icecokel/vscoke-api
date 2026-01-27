import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { GoogleAuthGuard } from './google-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [GoogleAuthGuard],
  exports: [GoogleAuthGuard, TypeOrmModule], // Export GoogleAuthGuard and TypeOrmModule so other modules can use them
})
export class AuthModule {}
