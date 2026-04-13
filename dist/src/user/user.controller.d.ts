import { SignupDto } from './dto/signup.dto';
import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    signup(dto: SignupDto): Promise<import("./user.entity").User>;
    doctorOnly(): string;
    patientOnly(): string;
}
