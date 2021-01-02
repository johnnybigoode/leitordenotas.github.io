import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

import SessionService from '../session/session.service';

@Injectable({
    providedIn: 'root'
})
export default class ApiService {
    private requestBody: any;

    constructor(
        private http: HttpClient,
        private session: SessionService
    ) { }

    private post(endpoint: string) {
        return this.http.post(environment.apiServer + '/' + endpoint, this.requestBody, {
            headers: { 'x-bggg-session': this.session.id }
        });
    }

    private pvtPost(endpoint: string) {
        return this.post('pvt/' + endpoint);
    }

    upload(requestBody: any) {
        this.requestBody = requestBody;
        return this.pvtPost('upload');
    }

    token(token: string) {
        this.requestBody = token;
        return this.post('token');
    }

    login(email: string) {
        this.requestBody = email;
        return this.post('login');
    }
}
