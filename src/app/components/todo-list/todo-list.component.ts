import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Todo } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css']
})
export class TodoListComponent implements OnInit {
  todos: Todo[] = [];
  form: FormGroup;
  editingId: number | null = null;
  loading = false;
  error: string | null = null;

  constructor(private todoService: TodoService, private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      completed: [false]
    });
  }

  ngOnInit(): void {
    this.loadTodos();
  }

  loadTodos(): void {
    this.loading = true;
    this.todoService.getAll().subscribe({
      next: t => { this.todos = t; this.loading = false; },
      error: err => { this.error = 'No se pudieron cargar los todos.'; this.loading = false; }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const value: Todo = this.form.value;
    if (this.editingId == null) {
      // crear
      this.todoService.create(value).subscribe({
        next: created => { this.todos.push(created); this.form.reset({ completed: false }); },
        error: () => this.error = 'Error al crear todo.'
      });
    } else {
      // actualizar
      this.todoService.update(this.editingId, value).subscribe({
        next: updated => {
          const idx = this.todos.findIndex(t => t.id === updated.id);
          if (idx >= 0) this.todos[idx] = updated;
          this.cancelEdit();
        },
        error: () => this.error = 'Error al actualizar todo.'
      });
    }
  }

  edit(todo: Todo): void {
    this.editingId = todo.id ?? null;
    this.form.setValue({
      title: todo.title,
      description: todo.description ?? '',
      completed: todo.completed
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({ completed: false, title: '', description: '' });
  }

  remove(id?: number): void {
    if (id == null) return;
    if (!confirm('¿Eliminar esta tarea?')) return;
    this.todoService.delete(id).subscribe({
      next: () => { this.todos = this.todos.filter(t => t.id !== id); },
      error: () => this.error = 'Error al eliminar todo.'
    });
  }

  toggleCompleted(todo: Todo): void {
    if (!todo.id) return;
    const updated: Todo = { ...todo, completed: !todo.completed };
    this.todoService.update(todo.id, updated).subscribe({
      next: t => {
        const idx = this.todos.findIndex(x => x.id === t.id);
        if (idx >= 0) this.todos[idx] = t;
      },
      error: () => this.error = 'Error al actualizar estado.'
    });
  }
}
