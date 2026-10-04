import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

async function invalidatePublicCache(tags: string[]) {
  try {
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
    revalidatePath('/', 'layout')
  } catch (error) {
    // Payload also runs in CLI scripts, outside a Next request.
    if (error instanceof Error && error.message.includes('static generation store missing')) return
    throw error
  }
}

export const invalidateContent: CollectionAfterChangeHook & CollectionAfterDeleteHook = async ({
  doc,
}) => {
  await invalidatePublicCache(['content'])
  return doc
}

export const invalidateSchedules: CollectionAfterChangeHook & CollectionAfterDeleteHook = async ({
  doc,
}) => {
  await invalidatePublicCache(['schedules'])
  return doc
}

export const invalidateSettings: GlobalAfterChangeHook = async ({ doc }) => {
  await invalidatePublicCache(['settings'])
  return doc
}
