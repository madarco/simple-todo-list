
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, CheckCircle, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodo, setEditingTodo] = useState<{ id: number; title: string } | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      const filterInput = filter === 'all' ? undefined : { completed: filter === 'completed' };
      const result = await trpc.getTodos.query(filterInput);
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, [filter]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setIsLoading(true);
    try {
      const todoData: CreateTodoInput = { title: newTodoTitle.trim() };
      const newTodo = await trpc.createTodo.mutate(todoData);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setNewTodoTitle('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updateData: UpdateTodoInput = {
        id: todo.id,
        completed: !todo.completed
      };
      const updatedTodo = await trpc.updateTodo.mutate(updateData);
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === todo.id ? updatedTodo : t))
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleEditTodo = async (id: number, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const updateData: UpdateTodoInput = {
        id,
        title: newTitle.trim()
      };
      const updatedTodo = await trpc.updateTodo.mutate(updateData);
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === id ? updatedTodo : t))
      );
      setEditingTodo(null);
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const filteredTodos = todos.filter((todo: Todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const activeCount = todos.filter((todo: Todo) => !todo.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ Todo List</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Add Todo Form */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="flex gap-2">
              <Input
                placeholder="What needs to be done? 🚀"
                value={newTodoTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodoTitle(e.target.value)
                }
                className="flex-1"
                maxLength={255}
              />
              <Button type="submit" disabled={isLoading || !newTodoTitle.trim()}>
                {isLoading ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats and Filter */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Circle className="w-3 h-3" />
                  {activeCount} Active
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {completedCount} Completed
                </Badge>
              </div>
              <Badge variant="default">{todos.length} Total</Badge>
            </div>

            <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'active' | 'completed')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Tasks</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Todo List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              {filter === 'all' && '📋 All Tasks'}
              {filter === 'active' && '⚡ Active Tasks'}
              {filter === 'completed' && '✨ Completed Tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTodos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {filter === 'all' && (
                  <>
                    <div className="text-4xl mb-2">🎯</div>
                    <p>No tasks yet. Add one above to get started!</p>
                  </>
                )}
                {filter === 'active' && (
                  <>
                    <div className="text-4xl mb-2">🎉</div>
                    <p>No active tasks. You're all caught up!</p>
                  </>
                )}
                {filter === 'completed' && (
                  <>
                    <div className="text-4xl mb-2">📭</div>
                    <p>No completed tasks yet. Keep working!</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTodos.map((todo: Todo, index: number) => (
                  <div key={todo.id}>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleComplete(todo)}
                        className="mt-0.5"
                      />
                      
                      <div className="flex-1">
                        {editingTodo?.id === todo.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingTodo.title}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEditingTodo((prev) => prev ? { ...prev, title: e.target.value } : null)
                              }
                              onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter') {
                                  handleEditTodo(todo.id, editingTodo.title);
                                } else if (e.key === 'Escape') {
                                  setEditingTodo(null);
                                }
                              }}
                              onBlur={() => handleEditTodo(todo.id, editingTodo.title)}
                              autoFocus
                              maxLength={255}
                            />
                          </div>
                        ) : (
                          <div>
                            <p
                              className={`${
                                todo.completed
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-800'
                              } cursor-pointer`}
                              onClick={() => setEditingTodo({ id: todo.id, title: todo.title })}
                            >
                              {todo.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Created: {todo.created_at.toLocaleDateString()} at {todo.created_at.toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTodo({ id: todo.id, title: todo.title })}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTodo(todo.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {index < filteredTodos.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>💡 Click on a task title to edit it • Use the checkbox to mark as complete</p>
        </div>
      </div>
    </div>
  );
}

export default App;
