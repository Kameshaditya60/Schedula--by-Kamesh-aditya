import { UserRole } from '../user.entity';
export declare class SignupDto {
    mobile_number: string;
    role: UserRole;
    name: string;
    email?: string;
}
