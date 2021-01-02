import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadComponent } from './upload.component';
import { UploadDirective } from './upload.directive';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
    UploadComponent,
    UploadDirective,
  ],
  imports: [
    CommonModule,
    FontAwesomeModule
  ],
  exports: [
    UploadComponent
  ]
})
export class UploadModule { }
