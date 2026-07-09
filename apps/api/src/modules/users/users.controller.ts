import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { Paginated } from '@hardware-pos/shared';

import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUser } from './users.repository';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(
    @TenantId() tenantId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<PublicUser>> {
    return this.usersService.list(tenantId, query);
  }

  @Get(':id')
  getById(@TenantId() tenantId: string, @Param('id') id: string): Promise<PublicUser> {
    return this.usersService.getById(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateUserDto): Promise<PublicUser> {
    return this.usersService.create(tenantId, dto);
  }
}
