import client from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

export const login = (data: LoginRequest) =>
  client.post<Token>("/auth/login", data).then((r) => r.data);

export const register = (data: RegisterRequest) =>
  client.post<User>("/auth/register", data).then((r) => r.data);

export const getMe = () =>
  client.get<User>("/users/me").then((r) => r.data);