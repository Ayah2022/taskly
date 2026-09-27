// // shared/components/project-form/project-form.ts
// import { Component, effect, input, output, signal, untracked } from '@angular/core';
// import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
// import { RouterLink } from '@angular/router';
// import type { ProjectFormModel } from '../../../features/projects/models/project-form.model';

// @Component({
//   selector: 'app-project-form',
//   standalone: true,
//   imports: [FormField, RouterLink],
//   templateUrl: './project-form.html',
// })
// export class ProjectForm {
//   readonly heading = input.required<string>();
//   readonly subheading = input.required<string>();
//   readonly submitLabel = input.required<string>();
//   readonly submittingLabel = input.required<string>();

//   readonly initialValue = input<ProjectFormModel>({ name: '', description: '' });
//   readonly submitting = input(false);
//   readonly successMessage = input<string | null>(null);
//   readonly submitError = input<string | null>(null);

//   readonly formSubmit = output<ProjectFormModel>();

//   private readonly model = signal<ProjectFormModel>(this.initialValue());

//   readonly projectForm = form(this.model, (schema) => {
//     required(schema.name);
//     minLength(schema.name, 3);
//     maxLength(schema.name, 100);
//     maxLength(schema.description, 500);
//   });

//   constructor() {
//     // Re-sync internal model whenever the container hands us a new
//     // initial value (e.g. once the edit route's resolver data arrives).
//     effect(() => {
//       const value = this.initialValue();
//       untracked(() => this.model.set(value));
//     });
//   }

//   onSubmit(): void {
//     if (this.projectForm().invalid()) {
//       this.projectForm().markAsTouched();
//       return;
//     }

//     this.formSubmit.emit(this.model());
//   }
// }
