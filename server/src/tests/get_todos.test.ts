
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodosInput } from '../schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all todos when no filter is provided', async () => {
    // Create test todos
    await db.insert(todosTable).values([
      { title: 'Todo 1', completed: false },
      { title: 'Todo 2', completed: true },
      { title: 'Todo 3', completed: false }
    ]).execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Todo 1');
    expect(result[0].completed).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return only completed todos when completed filter is true', async () => {
    // Create test todos
    await db.insert(todosTable).values([
      { title: 'Todo 1', completed: false },
      { title: 'Todo 2', completed: true },
      { title: 'Todo 3', completed: true }
    ]).execute();

    const input: GetTodosInput = { completed: true };
    const result = await getTodos(input);

    expect(result).toHaveLength(2);
    result.forEach(todo => {
      expect(todo.completed).toEqual(true);
    });
  });

  it('should return only incomplete todos when completed filter is false', async () => {
    // Create test todos
    await db.insert(todosTable).values([
      { title: 'Todo 1', completed: false },
      { title: 'Todo 2', completed: true },
      { title: 'Todo 3', completed: false }
    ]).execute();

    const input: GetTodosInput = { completed: false };
    const result = await getTodos(input);

    expect(result).toHaveLength(2);
    result.forEach(todo => {
      expect(todo.completed).toEqual(false);
    });
  });

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array when filter matches no todos', async () => {
    // Create only incomplete todos
    await db.insert(todosTable).values([
      { title: 'Todo 1', completed: false },
      { title: 'Todo 2', completed: false }
    ]).execute();

    const input: GetTodosInput = { completed: true };
    const result = await getTodos(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
