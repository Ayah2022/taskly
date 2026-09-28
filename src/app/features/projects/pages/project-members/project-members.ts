import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MembersService } from '../../services/members.service';
import type { MemberModel } from '../../models/member.model';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [],
  templateUrl: './project-members.html',
})
export class ProjectMembers implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly membersService = inject(MembersService);

  isLoading = signal(true);
  hasError = signal(false);
  members = signal<MemberModel[]>([]);
  projectId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProjectMembers();
  }

  async loadProjectMembers(): Promise<void> {
    const projectRoute = this.route.parent;

    const projectId = projectRoute?.snapshot.paramMap.get('projectId');
    const project = projectRoute?.snapshot.data['project'];

    if (!projectId || !project) {
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.projectId.set(projectId);

    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      const members = await this.membersService.getProjectMembers(projectId);

      this.members.set(members);
    } catch (error) {
      console.error('Failed to load project members:', error);
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  getInitials(member: MemberModel): string {
    const name = member.metadata?.name;

    if (!name) {
      return '';
    }

    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
