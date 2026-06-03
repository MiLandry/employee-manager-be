export const typeDefs = /* GraphQL */ `
  enum HealthStatus {
    ok
    error
  }

  enum DbStatus {
    up
    down
  }

  enum EmploymentStatus {
    active
    inactive
    on_leave
  }

  type DbProbe {
    status: DbStatus!
    error: String
  }

  type Health {
    status: HealthStatus!
    timestamp: String!
    message: String
    db: DbProbe!
  }

  type Employee {
    id: ID!
    fullName: String!
    email: String!
    department: String!
    jobTitle: String!
    employmentStatus: EmploymentStatus!
    managerName: String!
    startDate: String!
    phone: String
    location: String
    createdAt: String!
    updatedAt: String!
  }

  input EmployeeInput {
    fullName: String!
    email: String!
    department: String!
    jobTitle: String!
    employmentStatus: EmploymentStatus!
    managerName: String!
    startDate: String!
    phone: String
    location: String
  }

  type Query {
    health: Health!
    employees(name: String, department: String): [Employee!]!
  }

  type Mutation {
    createEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: ID!, input: EmployeeInput!): Employee!
    deleteEmployee(id: ID!): Boolean!
  }
`
