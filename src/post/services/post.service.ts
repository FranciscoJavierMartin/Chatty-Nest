import { BadGatewayException, Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { InjectQueue } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { FilterQuery, Model } from 'mongoose';
import { Server } from 'socket.io';
import { Queue } from 'bull';
import { CreatePostDto } from '@/post/dto/requests/create-post.dto';
import { Post } from '@/post/models/post.schema';
import { CurrentUser } from '@/auth/interfaces/current-user.interface';
import { PostCacheService } from '@/post/services/post.cache.service';
import { UploaderService } from '@/shared/services/uploader.service';
import { UploadApiResponse } from 'cloudinary';
import { PostsDto } from '@/post/dto/responses/posts.dto';
import { GetPostsQuery } from '@/post/interfaces/post.interface';

const PAGE_SIZE = 10;

@Injectable()
@WebSocketGateway({ cors: true })
export class PostService {
  @WebSocketServer() socket: Server;

  constructor(
    private readonly postCacheService: PostCacheService,
    private readonly uploaderService: UploaderService,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectQueue('post') private readonly postQueue: Queue<Post>,
  ) {}

  /**
   * Create a post
   * @param createPostDto Post data
   * @param user post author
   * @param image Post image (Optional)
   * @returns Message confirming post creation
   */
  public async create(
    createPostDto: CreatePostDto,
    user: CurrentUser,
    image?: Express.Multer.File,
  ) {
    const postId = new ObjectId();

    const post: Post = {
      _id: postId,
      userId: user.userId,
      username: user.username,
      email: user.email,
      avatarColor: user.avatarColor,
      ...createPostDto,
      commentsCount: 0,
      imgId: '',
      imgVersion: '',
      createdAt: new Date(),
      reactions: {
        angry: 0,
        happy: 0,
        like: 0,
        love: 0,
        sad: 0,
        wow: 0,
      },
    };

    if (image) {
      try {
        const imageUploaded: UploadApiResponse =
          await this.uploaderService.uploadImage(image);
        post.imgVersion = imageUploaded.version.toString();
        post.imgId = imageUploaded.public_id;
      } catch (error) {
        throw new BadGatewayException('External server error');
      }
    }

    this.socket.emit('add-post', post);

    await this.postCacheService.storePostToCache(
      postId.toString(),
      user.userId,
      user.uId,
      post,
    );

    this.postQueue.add('addPostToDB', post);

    return {
      message: 'Post created successfully',
    };
  }

  /**
   * Save post to DB
   * @param post Post to be saved
   */
  public async savePostToDb(post: Post): Promise<void> {
    const postCreated = new this.postModel(post);
    await postCreated.save();
  }

  public async getAllPosts(page: number): Promise<PostsDto> {
    const skip: number = (page - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * page;
    const newSkip: number = skip ? skip + 1 : skip;
    let postsCount: number = 0;
    let posts: Post[] = [];

    const cachedPosts: Post[] = await this.postCacheService.getPostsFromCache(
      newSkip,
      limit,
    );

    if (cachedPosts.length) {
      posts = cachedPosts;
      postsCount = await this.postCacheService.getPostsCountInCache();
    } else {
      posts = await this.getPosts({}, skip, limit, { createdAt: -1 });
      postsCount = await this.postsCount();
    }

    return {
      posts,
      postsCount,
    };
  }

  public async getPosts(
    query: GetPostsQuery,
    skip = 0,
    limit = 0,
    sort: Record<string, 1 | -1>,
  ): Promise<Post[]> {
    let postQuery: FilterQuery<any> = {};

    if (query.imgId && query.gifUrl) {
      postQuery = { $or: [{ imgId: { $ne: '' } }, { gifUrl: { $ne: '' } }] };
    } else {
      postQuery = query;
    }

    return await this.postModel.aggregate([
      { $match: postQuery },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]);
  }

  public async postsCount(): Promise<number> {
    return await this.postModel.find({}).countDocuments();
  }

  public async remove(postId: string): Promise<void> {
    // TODO: Remove image from Cloudinary
    // this.socket.emit('delete post', postId);
  }

  public async getPostAuthorId(postId: string): Promise<string> {
    return (await this.postModel.findById(postId)).userId.toString();
  }
}
