
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo to Delete'
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;
    
    const input: DeleteTodoInput = {
      id: todoId
    };

    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify the todo was actually deleted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent todo', async () => {
    const input: DeleteTodoInput = {
      id: 999999 // Non-existent ID
    };

    const result = await deleteTodo(input);

    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const insertResults = await db.insert(todosTable)
      .values([
        { title: 'Todo 1' },
        { title: 'Todo 2' },
        { title: 'Todo 3' }
      ])
      .returning()
      .execute();

    const todoToDelete = insertResults[1]; // Delete the middle one
    
    const input: DeleteTodoInput = {
      id: todoToDelete.id
    };

    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify only the target todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.find(todo => todo.id === todoToDelete.id)).toBeUndefined();
    expect(remainingTodos.find(todo => todo.title === 'Todo 1')).toBeDefined();
    expect(remainingTodos.find(todo => todo.title === 'Todo 3')).toBeDefined();
  });
});
