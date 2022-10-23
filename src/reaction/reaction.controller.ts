import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ObjectId } from 'mongodb';
import { ValidateIdPipe } from '@/shared/pipes/validate-id.pipe';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { CurrentUser } from '@/auth/interfaces/current-user.interface';
import { IsNotAuthorGuard } from '@/post/decorators/is-not-author.guard';
import { ReactionService } from '@/reaction/services/reaction.service';
import { AddReactionDto } from '@/reaction/dto/requests/add-reaction.dto';

@ApiTags('Reaction')
@Controller('post/reactions')
export class ReactionsController {
  constructor(private readonly reactionService: ReactionService) {}

  @Post()
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'Post not found',
  })
  @UseGuards(AuthGuard(), IsNotAuthorGuard)
  add(
    @Body() addReactionDto: AddReactionDto,
    @GetUser() user: CurrentUser,
  ): void {
    return this.reactionService.create(addReactionDto, user);
  }

  @Delete(':postId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard(), IsNotAuthorGuard)
  remove(
    @Param('postId', ValidateIdPipe) postId: ObjectId,
    @GetUser('username') [username]: string,
  ) {
    return this.reactionService.remove(postId, username);
  }
}
