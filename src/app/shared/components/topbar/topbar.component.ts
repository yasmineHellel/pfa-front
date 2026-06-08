import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.models';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
})
export class TopbarComponent implements OnInit, OnDestroy {
  title = '';
  breadcrumb = '';
  private sub!: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateFromRoute();
    this.sub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(r => r.data)
    ).subscribe(data => {
      this.title      = data['title']      || '';
      this.breadcrumb = data['breadcrumb'] || '';
    });
  }

  private updateFromRoute(): void {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    route.data.subscribe(data => {
      this.title      = data['title']      || this.title;
      this.breadcrumb = data['breadcrumb'] || this.breadcrumb;
    });
  }

  get user(): User | null { return this.authService.getCurrentUser(); }

  logout(): void { this.authService.logout(); }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
