import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bull';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import { UploadApiResponse } from 'cloudinary';
import { firstLetterUppercase, generateRandomIntegers } from '@/helpers/utils';
import { UploaderService } from '@/shared/services/uploader.service';
import { UserService } from '@/user/services/user.service';
import { UserCacheService } from '@/user/services/user.cache.service';
import { UserDocument } from '@/user/models/user.model';
import { RegisterDto } from '@/auth/dto/requests/register.dto';
import { ResponseRegisterDto } from '@/auth/dto/responses/register.dto';
import { AuthUser, AuthDocument } from '@/auth/models/auth.model';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(AuthUser.name) private authModel: Model<AuthDocument>,
    private uploaderService: UploaderService,
    private jwtService: JwtService,
    private userService: UserService,
    private userCacheService: UserCacheService,
    @InjectQueue('auth') private authQueue: Queue<AuthDocument>,
    @InjectQueue('user') private userQueue: Queue<UserDocument>,
  ) {}

  /**
   * Create user (auth and user) in db and cache
   * @param registerDto User data
   * @param avatarImage User avatar file
   * @returns User created and JWT token
   */
  public async create(
    registerDto: RegisterDto,
    avatarImage: Express.Multer.File,
  ): Promise<ResponseRegisterDto | any> {
    let avatarUploaded: UploadApiResponse;

    if (await this.checkIfUserExists(registerDto.email, registerDto.username)) {
      throw new BadRequestException('User is already created');
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = generateRandomIntegers(12).toString();

    const authUser: AuthDocument = {
      _id: authObjectId,
      uId,
      ...registerDto,
    } as AuthDocument;

    try {
      avatarUploaded = await this.uploaderService.uploadImage(
        avatarImage,
        userObjectId.toString(),
        true,
        true,
      );
    } catch (error) {
      throw new BadGatewayException('External server error');
    }

    const userDataToCache: UserDocument = this.userService.getUserData(
      authUser,
      userObjectId,
    );

    userDataToCache.profilePicture = this.uploaderService.getImageUrl(
      avatarUploaded.version,
      avatarUploaded.public_id,
    );
    await this.userCacheService.storeUserToCache(
      userObjectId.toString(),
      uId,
      userDataToCache,
    );

    this.authQueue.add('addAuthUserToDB', authUser);
    this.userQueue.add('addUserToDB', userDataToCache);

    const jwtToken: string = this.signToken(authUser, userObjectId);

    return {
      message: 'User created successfully',
      user: userDataToCache,
      token: jwtToken,
    };
  }

  /**
   * Create auth user in DB
   * @param authUser auth user to be created
   */
  public async createAuthUser(authUser: AuthDocument): Promise<void> {
    const authUserCreated = new this.authModel({ ...authUser });
    await authUserCreated.save();
  }

  /**
   * Check if users exists in db by email or username
   * @param email
   * @param username
   * @returns True if user exists, False otherwise
   */
  public async checkIfUserExists(
    email: string,
    username: string,
  ): Promise<boolean> {
    return !!(await this.authModel
      .exists({
        $or: [
          { username: firstLetterUppercase(username) },
          { email: email.toLowerCase() },
        ],
      })
      .exec());
  }

  /**
   * Create JWT token
   * @param payload user data to be included in payload
   * @param userObjectId user id in db
   * @returns JWT Token
   */
  private signToken(
    { uId, email, username, avatarColor }: AuthDocument,
    userObjectId: ObjectId,
  ): string {
    return this.jwtService.sign({
      userId: userObjectId,
      uId,
      email,
      username,
      avatarColor,
    });
  }
}
