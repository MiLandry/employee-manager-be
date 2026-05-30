export class RepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export class DuplicateEmailError extends RepositoryError {
  readonly email: string

  constructor(email: string) {
    super(`Employee email already exists: ${email}`)
    this.name = 'DuplicateEmailError'
    this.email = email
  }
}

export class NotFoundError extends RepositoryError {
  readonly id: string

  constructor(id: string) {
    super(`Employee not found: ${id}`)
    this.name = 'NotFoundError'
    this.id = id
  }
}
