import { createSchema, createYoga } from 'graphql-yoga'
import type { AppDeps } from '../app'
import { resolveMockPrincipal } from '../auth/mockPrincipal'
import type { GraphQLContext } from './context'
import { resolvers } from './resolvers'
import { typeDefs } from './typeDefs'

export const createGraphQLYoga = (deps: AppDeps) => {
  const resolvePrincipal = deps.resolvePrincipal ?? resolveMockPrincipal

  const yoga = createYoga({
    schema: createSchema<GraphQLContext>({
      typeDefs,
      resolvers,
    }),
    graphqlEndpoint: '/graphql',
    graphiql: process.env.NODE_ENV !== 'production',
    context: ({ request }): GraphQLContext => ({
      request,
      principal: resolvePrincipal(request),
      probeDb: deps.probeDb,
      employees: deps.employees,
      onDatabaseUnavailable: deps.onDatabaseUnavailable,
    }),
  })

  return yoga
}
