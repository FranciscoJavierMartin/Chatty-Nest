import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { AuthDocument } from '../auth/schemas/auth.schema';

@Injectable()
export class UserService {
  getUserData(data: AuthDocument, userObjectId: ObjectId): any {
    console.log('get user data');
  }
}
