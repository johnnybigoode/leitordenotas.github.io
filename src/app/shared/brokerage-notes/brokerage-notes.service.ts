import { Injectable } from '@angular/core';

import ApiService from '../api/api.service';
import BrokerageNotes from './brokerage-notes.interface';

@Injectable({
    providedIn: 'root',
})
export default class BrokerageNotesService {
    private notesList: BrokerageNotes[] = [];
    private noteDetails: any[] = [];
    private noteErrors: any[] = [];

    constructor(
        private api: ApiService
    ) { }

    public uploadFiles(files: FileList): void {
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < files.length; i++) {
            this.upload(files[i]);
        }
    }

    private upload(file: File): void {
        const newNote: BrokerageNotes = {
            filename: file.name,
            responseComplete: false,
            serverError: false,
            noteDetails: [],
            error: {},
            server: {}
        };
        this.notesList.push(newNote);

        const formData = new FormData();
        formData.append('brokerageNote', file, file.name);

        this.api.upload(formData).toPromise()
            .then(response => {
                newNote.server = response;
                this.parseDetails(response);
            })
            .catch(err => { newNote.serverError = true; newNote.error = err; })
            .finally(() => { newNote.responseComplete = true; });
    }

    public getNotes(): { notesList: BrokerageNotes[], noteDetails: any[], noteErrors: any[] } {
        return {
            notesList: this.notesList,
            noteDetails: this.noteDetails,
            noteErrors: this.noteErrors,
        };
    }

    private parseDetails(serverResponse: any) {
        for (const n in serverResponse) {
            if (!Object.prototype.hasOwnProperty.call(serverResponse, n)) {
                continue;
            }

            const note = serverResponse[n];
            note.showNote = note._noteReadCompletely && note.trades && note.trades.length;
            this.noteDetails.push(note);

            if (note._messages.length) {
                this.noteErrors.push({
                    _messages: note._messages,
                    _page: note._page,
                    fileName: note.fileName,
                    number: note.number,
                });
            }
        }
    }
}
