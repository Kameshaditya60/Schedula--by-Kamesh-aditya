import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async signup(data: SignupDto): Promise<User> {
    const user = this.userRepo.create(data);
    return await this.userRepo.save(user);
  }
}