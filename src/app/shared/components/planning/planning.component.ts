import { Component } from '@angular/core';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html'
})
export class PlanningComponent {
  days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  mechanics = ['Sami K.', 'Khaled M.', 'Anis B.'];
}
