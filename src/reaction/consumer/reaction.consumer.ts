import { BaseConsumer } from '@/shared/consumer/base.consumer';
import { Process, Processor } from '@nestjs/bull';
import { DoneCallback, Job } from 'bull';
import { ReactionRepository } from '@/reaction/repositories/reaction.repository';
import { AddReactionJobData } from '@/reaction/interfaces/reaction.interface';
import { PostRepository } from '@/post/repositories/post.repository';
import { ReactionCacheService } from '@/reaction/services/reaction.cache.service';

@Processor('reaction')
export class ReactionConsumer extends BaseConsumer {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    private readonly postRepository: PostRepository,
    private readonly reactionCacheService: ReactionCacheService,
  ) {
    super('ReactionConsumer');
  }

  @Process({ name: 'addPostReaction', concurrency: 5 })
  public async addPostReactionToDB(
    job: Job<AddReactionJobData>,
    done: DoneCallback,
  ): Promise<void> {
    try {
      const [reactionInDb, postUpdated] = await Promise.all([
        await this.reactionRepository.saveReaction(
          job.data.reaction,
          job.data.previousFeeling,
        ),
        await this.postRepository.updatePostReactions(
          job.data.reaction.postId,
          job.data.reaction.feeling,
          job.data.previousFeeling,
        ),
      ]);

      job.progress(50);

      await this.reactionCacheService.savePostReactionToCache(
        job.data.reaction.postId,
        { ...job.data.reaction, _id: reactionInDb.upsertedId },
        postUpdated.reactions,
        job.data.previousFeeling,
      );

      job.progress(100);
      done(null, job.data);
    } catch (error) {
      this.logger.error(error);
      done(error as Error);
    }
  }
}
