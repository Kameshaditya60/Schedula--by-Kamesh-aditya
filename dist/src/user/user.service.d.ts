import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SignupDto } from './dto/signup.dto';
export declare class UserService {
    private userRepo;
    constructor(userRepo: Repository<User>);
    signup(data: SignupDto): Promise<User>;
}
