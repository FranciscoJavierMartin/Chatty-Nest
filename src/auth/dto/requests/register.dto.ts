import { ArgsType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@ArgsType()
export class RegisterDto {
  @ApiProperty({
    description: 'User name',
    example: 'johndoe',
    minLength: 4,
    maxLength: 8,
    nullable: false,
    uniqueItems: true,
  })
  @Field(() => String)
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'Johndoe1',
    minLength: 4,
    maxLength: 8,
    nullable: false,
  })
  @Field(() => String)
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  password: string;

  @ApiProperty({
    description: 'User email',
    example: 'john@doe.com',
    nullable: false,
    uniqueItems: true,
  })
  @Field(() => String)
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Avatar color',
    example: 'blue',
    nullable: false,
  })
  @Field(() => String)
  @IsString()
  avatarColor: string;
}
