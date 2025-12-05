import { browser } from '$app/environment'
import { syncEngine } from '$lib/db';

import type { Review, Project, Comment,} from '$lib/server/db/schema';


class ReviewsStore {
  private collection = browser ? syncEngine.collection('reviews') : null;
  
  data = $state<Review[]>([]);
  isLoading = $state(false);
  error = $state<Error | null>(null);
  
  get count() {
    return this.data.length;
  }
  
  get isEmpty() {
    return this.data.length === 0;
  }
  
  get published() {
    return this.data.filter(r => r.status === 'published');
  }
  
  get drafts() {
    return this.data.filter(r => r.status === 'draft');
  }
  
  get archived() {
    return this.data.filter(r => r.status === 'archived');
  }
  
  async load() {
    if (!this.collection) return;
    
    this.isLoading = true;
    this.error = null;
    
    try {
      await this.collection.load();
      this.data = this.collection.data as Review[];
    } catch (err) {
      this.error = err as Error;
      console.error('Failed to load reviews:', err);
    } finally {
      this.isLoading = false;
    }
  }
  
  async create(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.collection) return null;
    
    try {
      const newReview = {
        ...review,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
      };
      
      await this.collection.create(newReview);
      this.data = [...this.data, newReview as Review];
      
      return newReview;
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }
  
  async update(id: string, updates: Partial<Review>) {
    if (!this.collection) return;
    
    try {
      await this.collection.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
      
      this.data = this.data.map(review =>
        review.id === id ? { ...review, ...updates, updatedAt: new Date() } : review
      );
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }
  
  async delete(id: string) {
    if (!this.collection) return;
    
    try {
      await this.collection.delete(id);
      this.data = this.data.filter(review => review.id !== id);
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }
  
  findById(id: string) {
    return this.data.find(review => review.id === id);
  }
  
  findByProject(projectId: string) {
    return this.data.filter(review => review.projectId === projectId);
  }
  
  search(query: string) {
    const q = query.toLowerCase();
    return this.data.filter(
      review =>
        review.title.toLowerCase().includes(q) ||
        review.description?.toLowerCase().includes(q)
    );
  }
  
  sortByDate(order: 'asc' | 'desc' = 'desc') {
    return [...this.data].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return order === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }
}

export const reviewsStore = new ReviewsStore();

class ProjectsStore {
  private collection = browser ? syncEngine.collection('projects') : null;
  
  data = $derived<Project[]>(browser ? this.collection?.data : [] );
  isLoading = $state(false);
  error = $state<Error | null>(null);
  activeProject = $state<Project | null>(null);
  
  get count() {
    return this.data.length;
  }
  
  get isEmpty() {
    return this.data.length === 0;
  }
  
  get teamProjects() {
    return this.data.filter(p => p.isTeam);
  }
  
  get personalProjects() {
    return this.data.filter(p => !p.isTeam);
  }
  
  async load() {
    if (!this.collection) return;
    
    this.isLoading = true;
    this.error = null;
    
    try {
      await this.collection.load();
      this.data = this.collection.data as Project[];
    } catch (err) {
      this.error = err as Error;
      console.error('Failed to load projects:', err);
    } finally {
      this.isLoading = false;
    }
  }
  
  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.collection) return null;
    
    try {
      const newProject = {
        ...project,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await this.collection.create(newProject);
      this.data = [...this.data, newProject as Project];
      
      return newProject;
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }
  
  async update(id: string, updates: Partial<Project>) {
    if (!this.collection) return;
    
    try {
      await this.collection.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
      
      this.data = this.data.map(project =>
        project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project
      );
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }
  
  async delete(id: string) {
    if (!this.collection) return;
    
    try {
      await this.collection.delete(id);
      this.data = this.data.filter(project => project.id !== id);
      
      if (this.activeProject?.id === id) {
        this.activeProject = null;
      }
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }
  
  findById(id: string) {
    return this.data.find(project => project.id === id);
  }
  
  setActive(project: Project | null) {
    this.activeProject = project;
  }
  
  search(query: string) {
    const q = query.toLowerCase();
    return this.data.filter(
      project =>
        project.name.toLowerCase().includes(q) ||
        project.description?.toLowerCase().includes(q)
    );
  }
}

export const projectsStore = new ProjectsStore();

class CommentsStore {
  private collection = browser ? syncEngine.collection('comments') : null;
  
  data = $state<Comment[]>([]);
  isLoading = $state(false);
  error = $state<Error | null>(null);
  
  get count() {
    return this.data.length;
  }
  
  get isEmpty() {
    return this.data.length === 0;
  }
  
  async load() {
    if (!this.collection) return;
    
    this.isLoading = true;
    this.error = null;
    
    try {
      await this.collection.load();
      this.data = this.collection.data as Comment[];
    } catch (err) {
      this.error = err as Error;
      console.error('Failed to load comments:', err);
    } finally {
      this.isLoading = false;
    }
  }
  
  async create(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.collection) return null;
    
    try {
      const newComment = {
        ...comment,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isResolved: false,
      };
      
      await this.collection.create(newComment);
      this.data = [...this.data, newComment as Comment];
      
      return newComment;
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }
  
  async update(id: string, updates: Partial<Comment>) {
    if (!this.collection) return;
    
    try {
      await this.collection.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
      
      this.data = this.data.map(comment =>
        comment.id === id ? { ...comment, ...updates, updatedAt: new Date() } : comment
      );
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }
  
  async delete(id: string) {
    if (!this.collection) return;
    
    try {
      await this.collection.delete(id);
      this.data = this.data.filter(comment => comment.id !== id);
    } catch (err) {
      this.error = err as Error;
      throw err;
    }
  }
  
  findByReview(reviewId: string) {
    return this.data.filter(comment => comment.reviewId === reviewId);
  }
  
  findReplies(parentId: string) {
    return this.data.filter(comment => comment.parentId === parentId);
  }
  
  getThreaded(reviewId: string) {
    const comments = this.findByReview(reviewId);
    const topLevel = comments.filter(c => !c.parentId);
    
    return topLevel.map(comment => ({
      ...comment,
      replies: this.findReplies(comment.id),
    }));
  }
  
  async toggleResolved(id: string) {
    const comment = this.data.find(c => c.id === id);
    if (comment) {
      await this.update(id, { isResolved: !comment.isResolved });
    }
  }
}

export const commentsStore = new CommentsStore();

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  editorTheme: string;
  fontSize: number;
  videoQuality: 'low' | 'medium' | 'high';
  autoCompress: boolean;
  maxVideoSize: number;
  includeAudio: boolean;
  countdown: number;
  defaultSpeed: number;
  autoplay: boolean;
  aiEnabled: boolean;
  autoSummarize: boolean;
  detectSmells: boolean;
  suggestImprovements: boolean;
  geminiApiKey: string;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  editorTheme: 'vscode-dark',
  fontSize: 14,
  videoQuality: 'high',
  autoCompress: true,
  maxVideoSize: 100,
  includeAudio: true,
  countdown: 3,
  defaultSpeed: 1,
  autoplay: false,
  aiEnabled: true,
  autoSummarize: false,
  detectSmells: true,
  suggestImprovements: true,
  geminiApiKey: '',
};

class SettingsStore {
  settings = $state<AppSettings>(this.loadFromStorage());
  
  private loadFromStorage(): AppSettings {
    if (!browser) return defaultSettings;
    
    const stored = localStorage.getItem('codereview-settings');
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  }
  
  private saveToStorage() {
    if (browser) {
      localStorage.setItem('codereview-settings', JSON.stringify(this.settings));
    }
  }
  
  update(updates: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...updates };
    this.saveToStorage();
  }
  
  reset() {
    this.settings = { ...defaultSettings };
    this.saveToStorage();
  }
  
  get(key: keyof AppSettings) {
    return this.settings[key];
  }
}

export const settingsStore = new SettingsStore();


