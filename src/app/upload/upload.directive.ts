import { Directive, HostListener, HostBinding, Renderer2, ElementRef } from '@angular/core';

import BrokerageNotesService from '../shared/brokerage-notes/brokerage-notes.service';

@Directive({
    selector: '[appUpload]'
})
export class UploadDirective {

    // @HostBinding('style.background') private background = '#eee';

    @HostListener('dragover', ['$event']) public onDragOver(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.overClass();
    }

    @HostListener('dragleave', ['$event']) public onDragLeave(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.leaveClass();
    }

    @HostListener('drop', ['$event']) public onDrop(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.notesService.uploadFiles(evt.dataTransfer.files);
        this.leaveClass();
    }

    constructor(
        private notesService: BrokerageNotesService,
        private renderer: Renderer2,
        private hostElement: ElementRef
    ) { }

    private overClass(): void {
        this.renderer.addClass(this.hostElement.nativeElement, 'file-over');
    }

    private leaveClass(): void {
        this.renderer.removeClass(this.hostElement.nativeElement, 'file-over');
    }
}
