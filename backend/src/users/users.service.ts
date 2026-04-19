/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException('El email ya está registrado');

    const hashed = (await bcrypt.hash(dto.password, 10)) as string;
    const user = new this.userModel({ ...dto, password: hashed });
    return user.save();
  }

  async seedUsers(): Promise<void> {
    const users: CreateUserDto[] = [
      {
        name: 'Gerente Demo',
        email: 'gerente@traffic.com',
        password: 'gerente123',
        role: 'Gerente',
      },
      {
        name: 'Analista Demo',
        email: 'analista@traffic.com',
        password: 'analista123',
        role: 'Analista',
      },
      {
        name: 'Administrador Demo',
        email: 'admin@traffic.com',
        password: 'admin1234',
        role: 'Administrador',
      },
    ];

    for (const u of users) {
      const exists = await this.findByEmail(u.email);
      if (!exists) await this.create(u);
    }

    console.log('✅ Usuarios seed listos');
  }
}
