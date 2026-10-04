import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  deliverNotification,
  DeliveryFailedError,
  type Delivery,
} from '../../src/server/bookings/delivery'

const now = new Date('2026-10-04T00:00:00Z')
test('a successful delivery is persisted and subsequent runs do not resend', async () => {
  let state: Delivery = { status: 'pending', attempts: 0 }
  let sent = 0
  const dependencies = {
    now,
    send: async () => {
      sent++
    },
    save: async (next: Delivery) => {
      state = next
    },
  }
  assert(await deliverNotification(state, dependencies))
  assert.equal(state.status, 'sent')
  assert(!(await deliverNotification(state, dependencies)))
  assert.equal(sent, 1)
})
test('database failure after sending does not cause an automatic duplicate', async () => {
  let state: Delivery = { status: 'pending', attempts: 0 }
  let sent = 0
  const send = async () => {
    sent++
  }
  await assert.rejects(
    deliverNotification(state, {
      now,
      send,
      save: async (next) => {
        if (next.status === 'sent') throw Error('Database unavailable')
        state = next
      },
    }),
    /Database unavailable/,
  )
  assert.equal(state.status, 'sending')
  const save = async (next: Delivery) => {
    state = next
  }
  assert(!(await deliverNotification(state, { now, send, save })))
  assert(!(await deliverNotification(state, { now: new Date(now.getTime() + 180000), send, save })))
  assert.equal(state.status, 'uncertain')
  assert(!(await deliverNotification(state, { now: new Date(now.getTime() + 360000), send, save })))
  assert.equal(sent, 1)
})
test('a failed pre-send write prevents external delivery', async () => {
  let sent = 0
  await assert.rejects(
    deliverNotification(
      { status: 'pending', attempts: 0 },
      {
        now,
        send: async () => {
          sent++
        },
        save: async () => {
          throw Error('Database unavailable')
        },
      },
    ),
  )
  assert.equal(sent, 0)
})
test('known delivery failures back off and stop after five attempts', async () => {
  let state: Delivery = { status: 'pending', attempts: 0 }
  let sent = 0
  let clock = now
  const send = async () => {
    sent++
    throw new DeliveryFailedError('Rejected')
  }
  const save = async (next: Delivery) => {
    state = next
  }
  for (let attempt = 1; attempt <= 5; attempt++) {
    assert(!(await deliverNotification(state, { now: clock, send, save })))
    assert.equal(state.attempts, attempt)
    if (attempt < 5) {
      assert.equal(
        new Date(state.nextAttemptAt!).getTime() - clock.getTime(),
        60000 * 2 ** (attempt - 1),
      )
      await deliverNotification(state, { now: clock, send, save })
      assert.equal(sent, attempt)
      clock = new Date(state.nextAttemptAt!)
    }
  }
  await deliverNotification(state, { now: new Date(clock.getTime() + 86400000), send, save })
  assert.equal(sent, 5)
  assert.equal(state.nextAttemptAt, null)
})
test('an ambiguous transport failure requires operator review', async () => {
  let state: Delivery = { status: 'pending', attempts: 0 }
  await deliverNotification(state, {
    now,
    send: async () => {
      throw Error('Connection lost after DATA')
    },
    save: async (next) => {
      state = next
    },
  })
  assert.equal(state.status, 'uncertain')
  assert.equal(state.nextAttemptAt, null)
  assert(!state.lastError?.includes('DATA'))
})
