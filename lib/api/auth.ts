import apiClient from "./client"
import type { User } from "@/types/user"

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const response = await apiClient.post("/auth/login", { email, password })
    return response.data.user
  },

  async signup(name: string, email: string, password: string, role: string): Promise<User> {
    const response = await apiClient.post("/auth/signup", { name, email, password, role })
    return response.data.user
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout")
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get("/auth/me")
    return response.data.user
  },

  async getCurrentStudent(): Promise<User> {
    const response = await apiClient.get("/students/me")
    return response.data.student
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email })
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post("/auth/reset-password", { token, password })
  },
}
