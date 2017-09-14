import {GraphQLString, GraphQLNonNull, GraphQLID, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

export default new GraphQLObjectType({
  name: 'InviteCode',
  description: 'An invitation code to allow a user to sign-up',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: 'The invite code UUID'},
    code: {type: new GraphQLNonNull(GraphQLString), description: 'The invite code'},
    description: {type: new GraphQLNonNull(GraphQLString), description: 'The description of for whom the code was created'},
    roles: {type: new GraphQLList(GraphQLString), description: 'The roles to assign to users who sign-up with this invite code'},
    active: {type: GraphQLBoolean, description: 'Whether or not this invite code is active'},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})
