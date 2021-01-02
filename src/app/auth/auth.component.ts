import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import SessionService from '../shared/session/session.service';
import ApiService from '../shared/api/api.service';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.less']
})
export default class AuthComponent implements OnInit {
    private emailForm: FormGroup;
    private emailFormSent: boolean;
    private isAuthenticated: boolean;
    private loading: boolean;
    private sessionId: string;
    private tokenForm: FormGroup;

    constructor(
        private api: ApiService,
        private formBuilder: FormBuilder,
        private sessionService: SessionService,
    ) { }

    ngOnInit() {
        this.isAuthenticated = this.sessionService.isAuthenticated;

        this.buildForms();
    }

    private buildForms() {
        this.emailForm = this.formBuilder.group({
            email: [null, [Validators.required, Validators.email, Validators.minLength(5)]]
        });

        this.tokenForm = this.formBuilder.group({
            token: [null, [Validators.required, Validators.pattern('^[0-9]{6}$')]]
        });
    }

    submitTokenForm() {
        if (!this.tokenForm.valid) {
            return;
        }

        this.loading = true;

        this.api.token(this.tokenForm.value).subscribe(
            () => {
                this.loading = false;
                this.sessionService.id = this.sessionId;
            },
            () => {
                alert('Não foi possível validar o seu TOKEN. Por favor tente novamente.');
                location.reload();
            }
        );
    }

    public submitEmailForm() {
        if (!this.emailForm.valid) {
            return;
        }

        this.loading = true;

        this.api.login(this.emailForm.value).subscribe(
            (data: any) => {
                this.emailFormSent = true;
                this.loading = false;
                this.sessionId = data.session;
            },
            () => {
                alert('Houve um problema ao tentar enviar sua mensagem. Por favor tente novamente.');
                location.reload();
            }
        );
    }
}
