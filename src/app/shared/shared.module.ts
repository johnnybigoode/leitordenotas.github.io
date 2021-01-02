import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import SlideToggleDirective from './slide-toggle/slide-toggle.directive';

@NgModule({
    declarations: [
        SlideToggleDirective
    ],
    imports: [
        CommonModule,
        BrowserAnimationsModule
    ],
    exports: [
        SlideToggleDirective
    ]
})
export default class SharedModule { }
