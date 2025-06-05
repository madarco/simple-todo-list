
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestTodo = async (title: string = 'Test Todo'): Promise<number> => {
    const result = await db.insert(todosTable)
      .values({
        title,
        completed: false
      })
      .returning()
      .execute();
    return result[0].id;
  };

  it('should update todo title', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Updated Title');
    expect(result.completed).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update todo completion status', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Test Todo');
    expect(result.completed).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both title and completion status', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Completed Task',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Completed Task');
    expect(result.completed).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Database Updated',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify changes were persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Updated');
    expect(todos[0].completed).toBe(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    const todoId = await createTestTodo();
    
    // Get original timestamp
    const originalTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();
    const originalUpdatedAt = originalTodos[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999999,
      title: 'This should fail'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });
});
