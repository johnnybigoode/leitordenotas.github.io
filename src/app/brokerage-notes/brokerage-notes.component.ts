import { Component, OnInit } from '@angular/core';

import BrokerageNotesService from '../shared/brokerage-notes/brokerage-notes.service';
import BrokerageNotes from '../shared/brokerage-notes/brokerage-notes.interface';

const numberFormat = require('locutus/php/strings/number_format');

@Component({
    selector: 'app-brokerage-notes',
    templateUrl: './brokerage-notes.component.html',
    styleUrls: ['./brokerage-notes.component.less']
})
export class BrokerageNotesComponent implements OnInit {
    private notes: BrokerageNotes[] = [];
    private noteDetails: any[] = [];
    private noteErrors: any[] = [];

    constructor(
        private notesService: BrokerageNotesService
    ) { }

    ngOnInit(): void {
        const notesService = this.notesService.getNotes();
        this.notes = notesService.notesList;
        this.noteDetails = notesService.noteDetails;
        this.noteErrors = notesService.noteErrors;
    }

    private numberFormatBr(value) {
        return typeof value === 'undefined' ? '' : numberFormat(value, 2, ',', '.');
    }

    private numberFormatBr0(value) {
        return typeof value === 'undefined' ? '' : numberFormat(value, 0, ',', '.');
    }
}
