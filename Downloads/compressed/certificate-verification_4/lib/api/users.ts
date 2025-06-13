import apiClient from "./client"
import type { User, UserRole } from "@/types/user"

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: UserRole
  status?: "active" | "inactive"
}

export interface Role {
  id: string
  name: UserRole
  displayName: string
  permissions: string[]
  description: string
}

export const usersApi = {
  async getAll(params?: UserListParams) {
    const response = await apiClient.get("/users", { params })
    return response.data
  },

  async getById(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`)
    return response.data.user
  },

  async create(userData: {
    name: string
    email: string
    password: string
    role: UserRole
  }): Promise<User> {
    const response = await apiClient.post("/users", userData)
    return response.data.user
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const response = await apiClient.patch(`/users/${id}`, updates)
    return response.data.user
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },

  async updateStatus(id: string, status: "active" | "inactive"): Promise<User> {
    const response = await apiClient.patch(`/users/${id}/status`, { status })
    return response.data.user
  },

  async resetPassword(id: string): Promise<{ temporaryPassword: string }> {
    const response = await apiClient.post(`/users/${id}/reset-password`)
    return response.data
  },
}

export const rolesApi = {
  async getAll(): Promise<Role[]> {
    const response = await apiClient.get("/roles")
    return response.data.roles
  },

  async getById(id: string): Promise<Role> {
    const response = await apiClient.get(`/roles/${id}`)
    return response.data.role
  },

  async getPermissions(roleId: string): Promise<string[]> {
    const response = await apiClient.get(`/roles/${roleId}/permissions`)
    return response.data.permissions
  },
}
