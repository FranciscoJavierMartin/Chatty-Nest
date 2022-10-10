import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  HttpStatus,
  Get,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from '@/shared/emails/email.service';
import { AuthService } from '@/auth/services/auth.service';
import { RegisterDto } from '@/auth/dto/requests/register.dto';
import { ResponseRegisterDto } from '@/auth/dto/responses/register.dto';
import { LoginDto } from '@/auth/dto/requests/login.dto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { JwtPayload } from '@/auth/interfaces/jwt.payload';
import { UserDto } from '@/auth/dto/responses/user.dto';
import { ForgotPasswordDto } from '@/auth/dto/requests/forgot-password.dto';
import { InfoMessageDto } from '@/auth/dto/responses/info-message.dto';
import { ResetPasswordDto } from '@/auth/dto/requests/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  @Post('register')
  @UseInterceptors(
    FileInterceptor('avatarImage', {
      limits: {
        fieldSize: 50,
      },
    }),
  )
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created',
    type: ResponseRegisterDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({
    status: HttpStatus.BAD_GATEWAY,
    description: 'Error on internal request',
  })
  @ApiBody({ type: RegisterDto })
  public async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile(new ParseFilePipe({})) avatarImage: Express.Multer.File,
  ): Promise<ResponseRegisterDto> {
    return this.authService.create(registerDto, avatarImage);
  }

  @Get('login')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged',
    type: ResponseRegisterDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiBody({ type: LoginDto })
  public async login(@Body() loginDto: LoginDto): Promise<ResponseRegisterDto> {
    return this.authService.login(loginDto);
  }

  @Get('current-user')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User info',
    type: UserDto,
  })
  @UseGuards(AuthGuard())
  public async getCurrentUser(@GetUser() user: JwtPayload): Promise<UserDto> {
    const userFromServer = await this.authService.getUser(user.userId);
    return new UserDto(userFromServer);
  }

  @Post('forgot-password')
  public async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<InfoMessageDto> {
    await this.authService.sendForgotPasswordEmail(forgotPasswordDto.email);
    return {
      message: 'Password reset email sent',
    };
  }

  @Post('reset-password/:token')
  public async resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<InfoMessageDto> {
    // await this.authService.sendResetPasswordEmail(forgotPasswordDto.email);
    console.log(token, resetPasswordDto);
    return {
      message: 'Password reset email sent',
    };
  }
}
