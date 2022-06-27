import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FindDappMessagesQueryDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  readonly skip?: number;
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(500)
  @Type(() => Number)
  readonly take?: number;
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  readonly dappVerified?: boolean;
}
