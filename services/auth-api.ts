// Mock authentication service
interface User {
  id: string
  name: string
  email: string
  role: "admin" | "staff" | "student"
  avatar?: string
}

// Mock users database
const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@ims-certify.com",
    role: "admin",
  },
  {
    id: "2",
    name: "Staff Member",
    email: "staff@ims-certify.com",
    role: "staff",
  },
  {
    id: "3",
    name: "Almaz Tadesse",
    email: "almaz@example.com",
    role: "student",
  },
]

class AuthAPI {
  private currentUser: User | null = null

  async signIn(email: string, password: string): Promise<User> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = mockUsers.find((u) => u.email === email)
    if (!user) {
      throw new Error("Invalid email or password")
    }

    // In a real app, you'd verify the password here
    this.currentUser = user

    // Store in localStorage for persistence
    localStorage.setItem("currentUser", JSON.stringify(user))

    return user
  }

  async signUp(name: string, email: string, password: string, role: string): Promise<void> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if user already exists
    const existingUser = mockUsers.find((u) => u.email === email)
    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // In a real app, you'd create the user in the database
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: role as any,
    }

    mockUsers.push(newUser)
  }

  async getCurrentUser(): Promise<User | null> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Check localStorage for persisted user
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser)
      return this.currentUser
    }

    return null
  }

  signOut(): void {
    this.currentUser = null
    localStorage.removeItem("currentUser")
  }
}

export const authAPI = new AuthAPI()
