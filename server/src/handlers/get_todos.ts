
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodosInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const getTodos = async (input?: GetTodosInput): Promise<Todo[]> => {
  try {
    // Build query with conditional where clause
    const results = input?.completed !== undefined
      ? await db.select().from(todosTable).where(eq(todosTable.completed, input.completed)).execute()
      : await db.select().from(todosTable).execute();

    return results;
  } catch (error) {
    console.error('Get todos failed:', error);
    throw error;
  }
};
