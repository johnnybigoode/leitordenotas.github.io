import { Component, OnInit } from '@angular/core';

import BrokerageNotes from '../shared/brokerage-notes/brokerage-notes.interface';
import BrokerageNotesService from '../shared/brokerage-notes/brokerage-notes.service';

@Component({
  selector: 'app-export-tool',
  templateUrl: './export-tool.component.html',
  styleUrls: ['./export-tool.component.less']
})
export class ExportToolComponent implements OnInit {
  private notes: BrokerageNotes[] = [];
  // private noteDetails: any[] = [];
  // private noteErrors: any[] = [];

  constructor(
    private notesService: BrokerageNotesService
  ) { }

  ngOnInit(): void {
    const notesService = this.notesService.getNotes();
    this.notes = notesService.notesList;
    // this.noteDetails = notesService.noteDetails;
    // this.noteErrors = notesService.noteErrors;
  }

  private copyFn(textarea: HTMLTextAreaElement) {
    textarea.select();
    document.execCommand('copy', false, null);
  }
}
