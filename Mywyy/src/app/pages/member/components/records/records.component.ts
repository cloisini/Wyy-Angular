import { Component, EventEmitter, OnInit, ChangeDetectionStrategy, Input, Output } from '@angular/core';
import { RecordVal } from 'src/app/service/data-types/member.types';
import { RecordType } from 'src/app/service/member.service';
import { Song } from 'src/app/service/data-types/common.types';

@Component({
  selector: 'app-records',
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecordsComponent implements OnInit {
  @Input() records: RecordVal[];
  @Input() recordType: RecordType.weekData;
  @Input() listenSongs = 0;
  @Input() currentIndex = -1;


  @Output() onChangeType = new EventEmitter<RecordType>();
  @Output() onAddSong = new EventEmitter<[Song, boolean]>();
  @Output() onLikeSong = new EventEmitter<string>();
  @Output() onShareSong = new EventEmitter<Song>();

  constructor() { }

  ngOnInit() {
  }

}
