
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTodoInput = {
  title: 'Test Todo'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with default values', async () => {
    const result = await createTodo(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].created_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple todos with unique ids', async () => {
    const firstTodo = await createTodo({ title: 'First Todo' });
    const secondTodo = await createTodo({ title: 'Second Todo' });

    expect(firstTodo.id).not.toEqual(secondTodo.id);
    expect(firstTodo.title).toEqual('First Todo');
    expect(secondTodo.title).toEqual('Second Todo');
    
    // Both should have completed set to false by default
    expect(firstTodo.completed).toEqual(false);
    expect(secondTodo.completed).toEqual(false);
  });

  it('should handle long titles correctly', async () => {
    const longTitle = 'A'.repeat(255); // Maximum allowed length
    const testInputWithLongTitle: CreateTodoInput = {
      title: longTitle
    };

    const result = await createTodo(testInputWithLongTitle);

    expect(result.title).toEqual(longTitle);
    expect(result.title.length).toEqual(255);
  });
});
