import {GraphQLString, GraphQLNonNull, GraphQLID, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {GraphQLEmail, GraphQLDateTime} from 'graphql-custom-types'

import {GraphQLPhoneNumber} from 'src/server/graphql/types'

import AuthProviders from './AuthProviders'

export default new GraphQLObjectType({
  name: 'User',
  description: 'The user account',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: 'The user UUID'},
    active: {type: new GraphQLNonNull(GraphQLBoolean), description: 'True if the user is active'},
    email: {type: new GraphQLNonNull(GraphQLEmail), description: 'The user email'},
    emails: {type: new GraphQLNonNull(new GraphQLList(GraphQLEmail)), description: 'The user emails'},
    handle: {type: new GraphQLNonNull(GraphQLString), description: 'The user handle'},
    profileUrl: {type: GraphQLString, description: 'The user profile URL'},
    avatarUrl: {type: GraphQLString, description: 'The user avatar image URL'},
    name: {type: new GraphQLNonNull(GraphQLString), description: 'The user name'},
    phone: {type: GraphQLPhoneNumber, description: 'The user phone number'},
    dateOfBirth: {type: GraphQLDateTime, description: "The user's date of birth"},
    timezone: {type: GraphQLString, description: 'The user timezone'},
    roles: {type: new GraphQLList(GraphQLString), description: 'The user roles'},
    inviteCode: {type: GraphQLString, description: 'The invite code the user used to sign up'},
    authProviders: {type: AuthProviders, description: 'The user auth providers'},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})
