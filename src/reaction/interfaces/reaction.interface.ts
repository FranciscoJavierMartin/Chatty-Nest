import { ObjectId } from 'mongodb';
import { Feelings } from '@/post/interfaces/post.interface';

export interface AddReactionJobData {
  reaction: AddReactionData;
  previousFeeling?: Feelings;
}

export interface AddReactionData {
  postId: ObjectId;
  feeling: Feelings;
  avatarColor: string;
  username: string;
  profilePicture: string;
}