import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import AuthComponent from './auth.component';
import SharedModule from '../shared/shared.module';

@NgModule({
    declarations: [
        AuthComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
    ],
    exports: [
        AuthComponent
    ]
})
export class AuthModule { }
