import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindDappMessagesQueryDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  readonly skip?: number;
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(500)
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
