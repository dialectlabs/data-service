import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class FindDappMessagesQueryDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  readonly skip?: number;
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  readonly take?: number;
}
