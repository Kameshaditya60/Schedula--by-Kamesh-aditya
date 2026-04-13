export declare enum UserRole {
    PATIENT = "PATIENT",
    DOCTOR = "DOCTOR",
    ADMIN = "ADMIN"
}
export declare class User {
    user_id: string;
    mobile_number: string;
    role: UserRole;
    name: string;
    email: string;
    created_at: Date;
    updated_at: Date;
}
