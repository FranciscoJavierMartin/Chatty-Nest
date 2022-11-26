import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bull';
import { getQueues } from '@/helpers/utils';
import { AuthModule } from '@/auth/auth.module';
import { UserConsumer } from '@/user/consumers/user.consumer';
import { User, UserSchema } from '@/user/models/user.model';
import { UserService } from '@/user/services/user.service';
import { UserController } from '@/user/user.controller';
import { UserCacheService } from '@/user/services/user.cache.service';
import { UserRepository } from '@/user/repositories/user.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    BullModule.registerQueue(...getQueues('user')),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserConsumer, UserCacheService, UserRepository],
  exports: [UserService, UserConsumer, UserCacheService, UserRepository],
})
export class UserModule {}
