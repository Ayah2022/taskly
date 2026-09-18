import { Component, inject } from '@angular/core';
import { ProjectsService } from '../../services/projects.service';
@Component({
  imports: [],
  selector: 'app-add-project',
  styleUrl: './add-project.css',
  templateUrl: './add-project.html',
})
export class AddProject {
  private readonly projectsService = inject(ProjectsService);

  async testCreateProject(): Promise<void> {
    try {
      const project = await this.projectsService.createProject({
        name: 'Skyline Residence Phase II',
        description:
          'Structural review and aesthetic curation for the high-rise residential complex in the downtown district tes...',
      });

      console.log('Created:', project);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  }
}
