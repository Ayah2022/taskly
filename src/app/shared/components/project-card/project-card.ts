// project-card.component.ts
import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-project-card',
  standalone: true,
  templateUrl: './project-card.html',
  imports: [DatePipe, RouterLink],
})
export class ProjectCard {
  readonly id = input.required<string>();
  readonly name = input.required<string>();
  readonly description = input.required<string>();
  readonly createdAt = input.required<string>();
}
