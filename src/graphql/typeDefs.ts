export const typeDefs = /* GraphQL */ `
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.3"
      import: ["@key", "@shareable"]
    )

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

  enum Department {
    Engineering
    Sales
    HR
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

  type Employee @key(fields: "id") {
    id: ID!
    fullName: String!
    email: String!
    department: Department!
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
    department: Department!
    jobTitle: String!
    employmentStatus: EmploymentStatus!
    managerName: String!
    startDate: String!
    phone: String
    location: String
  }

  type Query {
    health: Health!
    employees(name: String, department: Department): [Employee!]!
  }

  type Mutation {
    createEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: ID!, input: EmployeeInput!): Employee!
    deleteEmployee(id: ID!): Boolean!
  }
`
