import { expressionType } from '@angular/compiler/src/output/output_ast';
import { NumberValueAccessor } from '@angular/forms';

export interface AnyJson  {
        [key: string]: any;
}


export interface SampleBack extends AnyJson {
        code: number;
}

export interface Banner {

        targetId: number;
        url: string;
        imageUrl: string;

}
export interface HotTag {

        id: number;
        name: string;
        position: number;

}
export interface Singer {

        id: number;
        name: string;
        albumSize: number;
        picUrl: string;
        alias: string[];

}

export interface  SingerDetail {
        artist: Singer;
        hotSongs: Song[];
}

// 歌曲
export interface Song {

        id: number;
        name: string;
        url: string;
        ar: Singer[];
        al: {id: number; name: string; picUrl: string};
        dt: number;
}
// 歌单
export interface SongSheet {

        id: number;
        userId: number;
        name: string;
        playCount: number;
        coverImgUrl: string;
        picUrl: string;
        tags: string[];
        createTime: number;
        creator: { nickname: string; avatarUrl: string; };
        description: string;
        subscribedCount: number;
        shareCount: number;
        commentCount: number;
        subscribed: boolean;
        tracks: Song[];
        trackCount: number;

}
// 歌曲地址
export interface SongUrl {

        id: number;
        url: string;

}
// 歌词
export interface Lyric {
        lyric: string;
        tlyric: string;
}

// 歌单列表

export interface SheetList {
        playlist: SongSheet[];
        total: NumberValueAccessor;
}

export interface SearchResult {
        artists?: Singer[];
        playlists?: SongSheet[];
        songs?: Song[];
}


