import { Component, inject, OnInit, signal } from '@angular/core';
import { ProjectCard } from '../../../../shared/components/project-card/project-card';
import { ProjectsService } from '../../services/projects.service';
import type { ProjectModel } from '../../models/project.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [ProjectCard, RouterLink],
  templateUrl: './project-list.html',
})
export class ProjectList implements OnInit {
  private readonly projectsService = inject(ProjectsService);

  projects = signal<ProjectModel[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const projects = await this.projectsService.getProjects();

      this.projects.set(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }
}
