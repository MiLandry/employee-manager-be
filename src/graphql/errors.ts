import { GraphQLError } from 'graphql'

export const graphqlAuthError = (
  message: string,
  code: 'UNAUTHENTICATED' | 'FORBIDDEN',
): GraphQLError =>
  new GraphQLError(message, {
    extensions: {
      code,
      http: { status: code === 'UNAUTHENTICATED' ? 401 : 403 },
    },
  })

export const graphqlAppError = (
  message: string,
  code: string,
  status = 400,
): GraphQLError =>
  new GraphQLError(message, {
    extensions: {
      code,
      http: { status },
    },
  })
