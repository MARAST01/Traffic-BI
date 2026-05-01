import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

interface DemoUser {
  role:     string;
  email:    string;
  password: string;
  color:    string;
}

const DEMO_USERS: DemoUser[] = [
  { role: 'Gerente',       email: 'gerente@traffic.com',  password: 'gerente123',  color: 'demo-btn--blue'   },
  { role: 'Analista',      email: 'analista@traffic.com', password: 'analista123', color: 'demo-btn--green'  },
  { role: 'Administrador', email: 'admin@traffic.com',    password: 'admin1234',   color: 'demo-btn--yellow' },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, NgIf, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl:    './login.scss',
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  demoUsers  = DEMO_USERS;
  showPass   = signal(false);
  errorMsg   = signal('');
  isLoading  = this.auth.loading;

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Getters para validación en template
  get emailCtrl()    { return this.form.controls.email;    }
  get passwordCtrl() { return this.form.controls.password; }

  fillDemo(user: DemoUser) {
    this.form.patchValue({ email: user.email, password: user.password });
    this.errorMsg.set('');
  }

  togglePass() {
    this.showPass.update(v => !v);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMsg.set('');

    const { email, password } = this.form.value;

    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        const msg = err?.error?.message as string | undefined;
        this.errorMsg.set(msg ?? 'Credenciales incorrectas. Intenta de nuevo.');
      },
    });
  }
}