export interface CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    schoolId?: string;
    role?: string;
}
export interface UpdateUserDto {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    emailVerified?: boolean;
    preferences?: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface UserQueryDto {
    page?: number;
    limit?: number;
    schoolId?: string;
    role?: string;
    search?: string;
    isActive?: boolean;
}
export interface UserResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone?: string;
    avatar?: string;
    emailVerified: boolean;
    lastLoginAt?: Date;
    schoolId?: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=UserDto.d.ts.map