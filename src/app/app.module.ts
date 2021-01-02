import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CookieService } from 'ngx-cookie-service';

import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { BrokerageNotesComponent } from './brokerage-notes/brokerage-notes.component';
import { ExportToolComponent } from './export-tool/export-tool.component';

@NgModule({
    declarations: [
        AppComponent,
        BrokerageNotesComponent,
        ExportToolComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        AuthModule,
        UploadModule,
    ],
    providers: [CookieService],
    bootstrap: [AppComponent]
})
export class AppModule { }
