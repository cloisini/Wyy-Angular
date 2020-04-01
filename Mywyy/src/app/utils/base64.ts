import { AnyJson } from '../service/data-types/common.types';
import { Base64 } from 'js-base64';

export function codeJson(source: AnyJson, type = 'encode'): AnyJson {
    console.log('source :', source);
    const result = {};
    for (const attr in source) {
        if (source.hasOwnProperty(attr)) {
            result[Base64[type](attr)] = Base64[type](source[attr]);
        }
    }
    return result;
}
