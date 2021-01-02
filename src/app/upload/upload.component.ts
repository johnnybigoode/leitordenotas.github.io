import { Component, OnInit } from '@angular/core';
import { faFileUpload } from '@fortawesome/free-solid-svg-icons';

import ApiService from '../shared/api/api.service';
import BrokerageNotes from '../shared/brokerage-notes/brokerage-notes.interface';
import BrokerageNotesService from '../shared/brokerage-notes/brokerage-notes.service';

@Component({
    selector: 'app-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.less']
})
export class UploadComponent implements OnInit {
    private faFileUpload = faFileUpload;
    private files: Set<File>;
    private notes: BrokerageNotes[] = [];

    constructor(
        private api: ApiService,
        private notesService: BrokerageNotesService
    ) { }

    ngOnInit(): void {
        this.notes = this.notesService.getNotes().notesList;
    }

    private hasNotes(): boolean {
        return !!this.notesService.getNotes().notesList.length;
    }

    private handleFileInput(files: FileList) {
        this.notesService.uploadFiles(files);
    }
}
