import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuditLogService, CreateAuditLogDto } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Tipo del payload JWT tal como lo firma AuthService
interface JwtPayload {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * POST /audit-logs
   * El userId/email/role se extraen del JWT — nunca del body.
   */
  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: { filters: CreateAuditLogDto['filters']; page: string },
  ) {
    const { id, email, name, role } = req.user;
    const dto: CreateAuditLogDto = {
      userId: id,
      userEmail: email,
      userName: name ?? email,
      userRole: role,
      filters: body.filters,
      page: body.page,
    };
    return this.auditLogService.create(dto);
  }

  /**
   * GET /audit-logs?page=1&limit=20
   * Solo Administrador.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('Administrador')
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    console.log('GET audit-logs llamado'); // 👈
    return this.auditLogService.findAll(Number(page), Number(limit));
  }
}
