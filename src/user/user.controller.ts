import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ValidateIdPipe } from '@/shared/pipes/validate-id.pipe';
import { ID } from '@/shared/interfaces/types';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { UserService } from '@/user/services/user.service';
import { UserInfoDto } from '@/user/dto/requests/user-info.dto';
import { SocialLinksDto } from '@/user/dto/requests/social-links.dto';
import { NotificationSettingsDto } from '@/user/dto/requests/notification-settings.dto';
import { UserDto } from '@/user/dto/responses/user.dto';
import { SearchUserDto } from '@/user/dto/responses/search-user.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('search/:query')
  @ApiParam({
    name: 'query',
    description: 'Criteria to search',
  })
  @ApiOkResponse({
    description: 'User list with match with query param',
    isArray: true,
    type: [SearchUserDto],
  })
  public async searchUser(
    @Param('query') query: string,
  ): Promise<SearchUserDto[]> {
    return this.userService.searchUser(query);
  }

  // TODO: Get user is is authenticated (Interceptor or middleware)
  @Get('profile/suggestions')
  @ApiOkResponse({
    description: 'Random users',
    isArray: true,
    type: [UserDto],
  })
  public async getRandomUsers(): Promise<UserDto[]> {
    return this.userService.getRandomUsers();
  }

  @Get('profile/:userId')
  @ApiParam({
    name: 'userId',
    description: 'User id',
  })
  @ApiOkResponse({
    description: 'User profile',
    type: UserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  public async getProfileByUserId(
    @Param('userId', ValidateIdPipe) userId: ID,
  ): Promise<UserDto> {
    return this.userService.getProfileByUserId(userId);
  }

  @Patch('profile/user-info')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @ApiOkResponse({
    description: 'User info updated',
  })
  public async updateUserInfo(
    @Body() userInfoDto: UserInfoDto,
    @GetUser('userId') userId: ID,
  ): Promise<void> {
    await this.userService.updateUserInfo(userId, userInfoDto);
  }

  @Patch('profile/social-links')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @ApiOkResponse({
    description: 'Social links updated',
  })
  public async updateSocialLinks(
    @Body() socialLinksDto: SocialLinksDto,
    @GetUser('userId') userId: ID,
  ): Promise<void> {
    await this.userService.updateSocialLinks(userId, socialLinksDto);
  }

  @Patch('profile/notification-settings')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @ApiOkResponse({
    description: 'Notification settings updated',
  })
  public async updateNotificationSettings(
    @Body() notificationsDto: NotificationSettingsDto,
    @GetUser('userId') userId: ID,
  ): Promise<void> {
    // await this.userService.updateSocialLinks(userId, socialLinksDto);
  }
}
