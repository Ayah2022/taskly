import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';
@Component({
  selector: 'app-layout',
  styleUrl: './layout.css',
  templateUrl: './layout.html',
  imports: [RouterOutlet, Header, Sidebar],
})
export class Layout {}
