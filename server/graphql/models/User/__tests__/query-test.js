import test from 'ava'

import {downcaseTrimTo21Chars} from 'src/common/util'
import {connect} from 'src/db'
import {resetData, cleanupDB} from 'src/test/db'
import {runQuery} from 'src/test/graphql'
import {createUsers, assertQueryError} from 'src/test/helpers'
import factory from 'src/test/factories'

import api from '../query'

const r = connect()

const fields = 'id name handle active email phone profileUrl avatarUrl roles inviteCode createdAt updatedAt'
const queries = {
  getUserById: `query($id: ID!) { getUserById(id: $id) { ${fields} } }`,
  getUsersByIds: `query($ids: [ID]!) { getUsersByIds(ids: $ids) { ${fields} } }`,
  getUsersByHandles: `query($handles: [String]!) { getUsersByHandles(handles: $handles) { ${fields} } }`,
  getUser: `query($identifier: String!) { getUser(identifier: $identifier) { ${fields} } }`,
  findUsers: `query($identifiers: [String]) { findUsers(identifiers: $identifiers) { ${fields} } }`,
  getActiveStatuses: 'query($ids: [ID]!) { getActiveStatuses(ids: $ids) { id active } }',
}

const ERROR_MSG_MISSING_PARAM = 'not provided'
const ERROR_MSG_NOT_FOUND = 'not found'
const ERROR_MSG_NOT_AUTH = 'not authorized'

const TEST_USER_COUNT = 5
const TEST_USER_INVITE_CODE = 'test-invite-code'
const TEST_USER_ROLES = ['admin']

test.before(async () => {
  await resetData()
})

test.after(async () => {
  await cleanupDB()
})

test('getUserById: returns correct user for valid id', async t => {
  t.plan(3)
  const {users: [testUser]} = await _createTestData()
  const result = await runQuery(queries.getUserById, api, {id: testUser.id})
  t.is(result.data.getUserById.id, testUser.id)
  t.is(result.data.getUserById.inviteCode, TEST_USER_INVITE_CODE)
  t.deepEqual(result.data.getUserById.roles, TEST_USER_ROLES)
})

test('getUserById: throws an error if id is missing', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_MISSING_PARAM,
    queries.getUserById
  )
})

test('getUserById: throws an error if id is not matched', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_NOT_FOUND,
    queries.getUserById,
    {id: 'fake.id'}
  )
})

test('getUserById: throws an error if user is not signed-in', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_NOT_AUTH,
    queries.getUserById,
    {id: 'fake.id'},
    {currentUser: null}
  )
})

test('getUsersByIds: returns array of correct users for array of valid ids', async t => {
  const {users} = await _createTestData()

  t.plan(1 + users.length)

  const ids = users.map(u => u.id)
  const result = await runQuery(queries.getUsersByIds, api, {ids})
  const matchedUsers = result.data.getUsersByIds

  t.is(matchedUsers.length, users.length)

  users.forEach(user => (
    t.truthy(matchedUsers.find(match => match.id === user.id))
  ))
})

test('getUsersByIds: returns empty array for empty array of ids', async t => {
  const result = await runQuery(queries.getUsersByIds, api, {ids: []})
  t.is(result.data.getUsersByIds.length, 0)
})

test('getUsersByIds: throws an error if ids is missing', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_MISSING_PARAM,
    queries.getUsersByIds
  )
})

test('getUsersByIds: throws an error if user is not signed-in', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_NOT_AUTH,
    queries.getUsersByIds,
    {ids: ['fake.id']},
    {currentUser: null}
  )
})

test('getUsersByHandles: returns array of correct users for array of valid handles', async t => {
  const {users} = await _createTestData()

  t.plan(1 + users.length)

  const handles = users.map(u => u.handle)
  const result = await runQuery(queries.getUsersByHandles, api, {handles})
  const matchedUsers = result.data.getUsersByHandles

  t.is(matchedUsers.length, users.length)

  users.forEach(user => {
    t.truthy(matchedUsers.find(match => match.handle === user.handle))
  })
})

test('getUsersByHandles: returns empty array for empty array of handles', async t => {
  const result = await runQuery(queries.getUsersByHandles, api, {handles: []})
  t.is(result.data.getUsersByHandles.length, 0)
})

test('getUsersByHandles: throws an error if handles is missing', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_MISSING_PARAM,
    queries.getUsersByHandles
  )
})

test('getUsersByHandles: throws an error if user is not signed-in', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_NOT_AUTH,
    queries.getUsersByHandles,
    {handles: ['fake.handle']},
    {currentUser: null}
  )
})

test('getUsersByHandles: returns the correct users for Slack-compatible handles', async t => {
  const overwriteObjs = [{
    handle: 'HasUppercase',
  }, {
    handle: 'isLongerThanTwentyOneCharacters',
  }]
  const users = await factory.buildMany('user', overwriteObjs)
  await r.table('users').insert(users)
  const result = await runQuery(queries.getUsersByHandles, api, {
    handles: users.map(user => downcaseTrimTo21Chars(user.handle))
  })
  const resultUsers = result.data.getUsersByHandles
  t.is(resultUsers.length, users.length, 'found wrong number of users')
})

test('getUser: returns correct user for a Slack-compatible handle', async t => {
  const user = await factory.build('user', {handle: 'isMuchLongerThanTwentyOneCharacters'})
  await r.table('users').insert(user)
  const result = await runQuery(queries.getUser, api, {
    identifier: downcaseTrimTo21Chars(user.handle)
  })
  t.is(result.data.getUser.email, user.email, 'users do not match')
})

test('getUser: returns correct user for valid identifier', async t => {
  const {users: [testUser]} = await _createTestData()
  const result = await runQuery(queries.getUser, api, {identifier: testUser.id})
  t.is(result.data.getUser.id, testUser.id)
})

test('getUser: returns correct user for valid handle', async t => {
  const {users: [testUser]} = await _createTestData()
  const result = await runQuery(queries.getUser, api, {identifier: testUser.handle})
  t.is(result.data.getUser.id, testUser.id)
})

test('getUser: throws an error if identifier is missing', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_MISSING_PARAM,
    queries.getUser
  )
})

test('getUser: throws an error if identifier is not matched', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_NOT_FOUND,
    queries.getUser,
    {identifier: 'fake.id'}
  )
})

test('getUser: throws an error if user is not signed-in', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_NOT_AUTH,
    queries.getUser,
    {identifier: ''},
    {currentUser: null}
  )
})

test('findUsers: returns correct user for combination of ids and handles', async t => {
  t.plan(4)
  const {users: [testUser1, testUser2, testUser3]} = await _createTestData()
  const identifiers = [testUser1.id, testUser2.handle, testUser3.id]
  const result = await runQuery(queries.findUsers, api, {identifiers})
  t.is(result.data.findUsers.length, 3)
  t.truthy(result.data.findUsers.find(u => u.id === testUser1.id))
  t.truthy(result.data.findUsers.find(u => u.handle === testUser2.handle))
  t.truthy(result.data.findUsers.find(u => u.id === testUser3.id))
})

test('findUsers: returns only unique users for duplicate identifiers', async t => {
  t.plan(2)
  const {users: [testUser1]} = await _createTestData()
  const identifiers = [testUser1.id, testUser1.handle]
  const result = await runQuery(queries.findUsers, api, {identifiers})
  t.is(result.data.findUsers.length, 1)
  t.is(result.data.findUsers[0].id, testUser1.id)
})

test('findUsers: returns all users if identifiers missing', async t => {
  const {users} = await _createTestData()
  const result = await runQuery(queries.findUsers, api)
  users.forEach(user => (
    t.truthy(result.data.findUsers.find(u => user.id === u.id))
  ))
})

test('findUsers: returns empty array of users for empty array of identifiers', async t => {
  const result = await runQuery(queries.findUsers, api, {identifiers: []})
  t.is(result.data.findUsers.length, 0)
})

test('findUsers: throws an error if user is not signed-in', async t => {
  await assertQueryError(
    t,
    api,
    ERROR_MSG_NOT_AUTH,
    queries.findUsers,
    null,
    {currentUser: null}
  )
})

test('getActiveStatuses: returns empty array for empty array', async t => {
  const result = await runQuery(queries.getActiveStatuses, api, {ids: []})
  t.is(result.data.getActiveStatuses.length, 0)
})

test('getActiveStatuses: returns the status for all IDs', async t => {
  t.plan(2)
  const {users} = await _createTestData()
  const ids = users.map(_ => _.id)
  const result = await runQuery(queries.getActiveStatuses, api, {ids})
  const statuses = result.data.getActiveStatuses
  const attributes = Object.keys(statuses[0])
  t.is(statuses.length, users.length)
  t.deepEqual(attributes, ['id', 'active'])
})

test('getActiveStatuses: does not require an authenticated user', async t => {
  const {users} = await _createTestData()
  const ids = users.map(_ => _.id)
  const result = await runQuery(queries.getActiveStatuses, api, {ids}, {/* no currentUser */})
  const statuses = result.data.getActiveStatuses
  t.is(statuses.length, users.length)
})

async function _createTestData() {
  return {
    users: await createUsers(TEST_USER_INVITE_CODE, TEST_USER_ROLES, TEST_USER_COUNT)
  }
}
