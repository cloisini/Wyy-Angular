import { PlayMode } from 'src/app/share/wy-ui/wy-player/player-types';
import { Song } from 'src/app/service/data-types/common.types';
import { createReducer, on, Action } from '@ngrx/store';
import { SetPlaying, SetPlayList, SetCurrentIndex, SetSongList, SetPlayMode, SetCurrentAction } from '../actions/player.actions';

export enum CurrentActions {
    Add,
    Play,
    Delete,
    Clear,
    Other
}

export interface PlayState {
    // 播放状态
    playing: boolean;

    // 播放模式
    playMode: PlayMode;

    // 歌曲列表
    songList: Song[];

    // 播放列表
    playList: Song[];

    // 当前正在播放的索引
    currentIndex: number;

    // 当前的操作
    currentAction: CurrentActions;

}

export const initialState: PlayState = {
    playing: false,
    songList: [],
    playList: [],
    playMode: { type: 'loop', label: '循环'},
    currentIndex: -1,
    currentAction: CurrentActions.Other
};

const reducer = createReducer(
    initialState,
    on(SetPlaying, (state, { playing }) => ({ ...state, playing})),
    on(SetPlayList, (state, { playList }) => ({ ...state, playList })),
    on(SetSongList, (state, { songList }) => ({ ...state, songList })),
    on(SetPlayMode, (state, { playMode }) => ({ ...state, playMode })),
    on(SetCurrentIndex, (state, { currentIndex }) => ({ ...state, currentIndex })),
    on(SetCurrentAction, (state, { currentAction }) => ({ ...state, currentAction })),


);
export function playerReducer(state: PlayState, action: Action) {
    return reducer(state, action);
}



// export const SetPlaying = createAction('[player] Set playing', props<{ playin: boolean }>());
// export const SetPlayList = createAction('[player] Set playlist', props<{ list: Song[] }>());
// export const SetSongList = createAction('[player] Set songList', props<{ list: Song[] }>());
// export const SetPlayMode = createAction('[player] Set playMode', props<{ mode: PlayMode }>());
// export const SetCurrentIndex = createAction('[player] Set currentIndex', props<{ index: number }>());

